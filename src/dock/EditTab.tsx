/** Tab "แก้ไข": pick any race, edit its data (ข้อมูล) or its own style (สไตล์). Non-active races show a preview. */
import { useState } from "react";
import { CLASSES, exportFile, GRADES, MAX_RUNNERS, MIN_RUNNERS, SURFACES, type Grade, type Race, type RaceClass, type Runner, type Scheme, type Style } from "../lib/model";
import { customPair, US } from "../lib/colors";
import { bumpImage, update, updateRace, useData } from "../lib/store";
import { deleteImage, putImage, raceImageKey } from "../lib/images";
import { Card } from "../overlay/Card";
import { Stage } from "../overlay/Stage";
import { FlagPicker } from "./FlagPicker";
import { download } from "./RacesTab";

const SCHEME_LABEL: Record<Scheme, string> = { jra: "JRA 8 สีตามซอง", us: "อเมริกา (Saddle towel)", plain: "ไม่มีสี (กรอบขาว)", custom: "Custom" };
const NO_SCHEME_LABEL: Record<Scheme, string> = { ...SCHEME_LABEL, jra: "JRA ตามซองของม้า" };
const CLASS_LABEL: Record<RaceClass, string> = { "2YO": "2YO", "2YO_F": "2YO (ตัวเมีย)", "3YO": "3YO", FM: "F&M" };

function Switch({ on, label, onToggle, testId }: { on: boolean; label: string; onToggle: () => void; testId?: string }) {
  return (
    <div className="swrow">
      <span>{label}</span>
      <button type="button" className="sw" role="switch" aria-checked={on} aria-label={label} data-testid={testId} onClick={onToggle} />
    </div>
  );
}

export function EditTab({ editing, setEditing }: { editing: string | null; setEditing: (id: string) => void }) {
  const d = useData();
  const [sub, setSub] = useState<"data" | "style">("data");
  const race = d.races.find((r) => r.id === editing) ?? d.races[0];
  if (!race) return <div className="pane" role="tabpanel" id="p-edit"><p className="hint">ยังไม่มีรายการแข่งขัน เพิ่มหรือนำเข้าได้ที่แท็บรายการแข่งขัน</p></div>;
  const isAct = race.id === d.active;
  const set = (patch: Partial<Race>) => updateRace(race.id, (r) => ({ ...r, ...patch }));
  const setStyle = (fn: (s: Style) => Style) => updateRace(race.id, (r) => ({ ...r, style: fn(r.style) }));
  const setRunner = (i: number, patch: Partial<Runner>) =>
    updateRace(race.id, (r) => {
      const runners = r.runners.map((h, j) => (j === i ? { ...h, ...patch } : h));
      const h = runners[i];
      return { ...r, runners, highlight: h.scratched && r.highlight === h.number ? null : r.highlight };
    });
  const imgKey = raceImageKey(race.id);
  const S = race.style;
  const n = race.runners.length;
  const showCustom = S.drawScheme === "custom" || S.numberScheme === "custom";
  const text = (k: "name" | "jpName" | "subtitle" | "course" | "round" | "postTime" | "date", label: string, extra: Record<string, string> = {}) => (
    <div className="field"><label htmlFor={`f-${k}`}>{label}</label>
      <input className="tx" id={`f-${k}`} value={race[k]} {...extra} onChange={(e) => set({ [k]: e.target.value } as Partial<Race>)} /></div>
  );

  return (
    <div className="pane" role="tabpanel" id="p-edit" aria-labelledby="tab-edit">
      <div className="etabs" role="tablist" aria-label="เลือกรายการที่จะแก้ไข">
        {d.races.map((x) => (
          <button key={x.id} type="button" role="tab" className="etab" data-e={x.id} aria-selected={x.id === race.id} onClick={() => setEditing(x.id)}>
            {x.id === d.active && <span className="dot" title="Active" />}{x.round || x.name}
          </button>
        ))}
      </div>
      <div className="estate">
        <span>{isAct ? "รายการนี้ Active อยู่ แก้แล้วขึ้นจอทันที" : "ไม่ได้ Active แก้ได้ แต่ยังไม่ขึ้นจอ (ดูพรีวิวด้านล่าง)"}</span>
        <span className="btns">
          {!isAct && <button className="btn primary" type="button" onClick={() => update((x) => ({ ...x, active: race.id }))}>ตั้งเป็น Active</button>}
          <button className="btn" type="button" onClick={() => download(`${race.date.replaceAll("-", "")}-${(race.round || race.name).replace(/\W+/g, "")}.json`, JSON.stringify(exportFile(d, race.id), null, 2))}>ส่งออกรายการนี้</button>
        </span>
      </div>
      {!isAct && <div className="mini"><Stage><Card race={race} scope="preview" /></Stage></div>}

      <div className="subtabs" role="tablist" aria-label="ส่วนที่แก้ไข">
        <button type="button" role="tab" className="subt" id="sub-data" aria-selected={sub === "data"} onClick={() => setSub("data")}>ข้อมูล</button>
        <button type="button" role="tab" className="subt" id="sub-style" aria-selected={sub === "style"} onClick={() => setSub("style")}>สไตล์</button>
      </div>

      {sub === "data" ? (
        <div className="subpane" role="tabpanel" aria-labelledby="sub-data">
          <div className="group">
            <b>รูปด้านซ้าย</b>
            <div className="btns">
              <label className="btn primary" htmlFor="pic">เลือกรูป…</label>
              <input type="file" id="pic" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { await putImage(imgKey, f); bumpImage(imgKey); } }} />
              {d.images[imgKey] ? <button className="btn" type="button" onClick={async () => { await deleteImage(imgKey).catch(() => {}); update((x) => { const images = { ...x.images }; delete images[imgKey]; return { ...x, images }; }); }}>ไม่ใช้รูป</button> : null}
            </div>
          </div>
          <div className="group">
            <b>ข้อมูลรายการ</b>
            {text("name", "ชื่อรายการ")}
            {text("jpName", "ชื่อญี่ปุ่น")}
            {text("subtitle", "บรรทัดรอง")}
            {text("date", "วันที่", { type: "date" })}
            {text("round", "เลขรอบ", { maxLength: "12", placeholder: "เช่น 11R, R11, Main" })}
            {text("postTime", "เวลาออกตัว", { placeholder: "15:40" })}
            {text("course", "สนาม")}
            <div className="field"><label htmlFor="f-surface">พื้น</label>
              <select id="f-surface" value={race.surface} onChange={(e) => set({ surface: e.target.value as Race["surface"] })}>{SURFACES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label htmlFor="f-dist">ระยะ (เมตร)</label>
              <input className="tx" id="f-dist" type="number" min={800} max={7000} step={100} value={race.distanceM ?? ""} onChange={(e) => set({ distanceM: e.target.value ? Math.round(+e.target.value) : null })} /></div>
            <div className="field"><label htmlFor="f-grade">เกรด</label>
              <select id="f-grade" value={race.grade ?? ""} onChange={(e) => set({ grade: (e.target.value || null) as Grade | null })}>
                <option value="">ไม่มี</option>{GRADES.map((g) => <option key={g} value={g}>{g === "L" ? "Listed" : g}</option>)}
              </select></div>
            <Switch on={race.jump} label="Jump race (ขึ้น J- หน้าเกรด)" onToggle={() => set({ jump: !race.jump })} />
            <div className="field"><label htmlFor="f-class">Class</label>
              <select id="f-class" value={race.class ?? ""} onChange={(e) => set({ class: (e.target.value || null) as RaceClass | null })}>
                <option value="">ไม่มี</option>{(Object.keys(CLASSES) as RaceClass[]).map((c) => <option key={c} value={c}>{CLASS_LABEL[c]}</option>)}
              </select></div>
          </div>
          <div className="group">
            <b>ไฮไลต์ม้าบนจอ (กดซ้ำเพื่อเอาออก)</b>
            <div className="hgrid">
              {race.runners.map((h) => (
                <button key={h.number} type="button" className="hb" data-h={h.number} aria-pressed={race.highlight === h.number} disabled={h.scratched}
                  onClick={() => set({ highlight: race.highlight === h.number ? null : h.number })}>{h.number}</button>
              ))}
            </div>
          </div>
          <div className="group">
            <b>ม้า {n} ตัว (รองรับ {MIN_RUNNERS}–{MAX_RUNNERS})</b>
            <div className="erow ehead" aria-hidden="true"><span>No</span><span>ชื่อม้า / จ็อกกี้</span><span>ธง</span><span>Fav</span><span>ถอน</span></div>
            <div className="list" data-testid="runner-rows">
              {race.runners.map((h, i) => (
                <div className="erow" key={h.number}>
                  <span className="n">{h.number}</span>
                  <input className="tx" aria-label={`ชื่อม้าเบอร์ ${h.number}`} value={h.name} onChange={(e) => setRunner(i, { name: e.target.value })} />
                  <FlagPicker label={`ธงม้าเบอร์ ${h.number}`} value={h.horseCountry} onChange={(c) => setRunner(i, { horseCountry: c })} />
                  <input className="tx" type="number" min={1} max={MAX_RUNNERS} aria-label={`อันดับตัวเต็งเบอร์ ${h.number}`} value={h.fav ?? ""} onChange={(e) => setRunner(i, { fav: e.target.value ? Math.max(1, Math.round(+e.target.value)) : null })} />
                  <input type="checkbox" aria-label={`ถอนเบอร์ ${h.number}`} checked={h.scratched} onChange={(e) => setRunner(i, { scratched: e.target.checked })} />
                  {S.autoDraw ? <span /> : <input className="tx draw" type="number" min={1} max={MAX_RUNNERS} aria-label={`ซองเบอร์ ${h.number}`} title="ซอง" placeholder="ซอง" value={h.draw ?? ""} onChange={(e) => setRunner(i, { draw: e.target.value ? Math.round(+e.target.value) : null })} />}
                  <input className="tx jk" aria-label={`จ็อกกี้เบอร์ ${h.number}`} placeholder="จ็อกกี้" value={h.jockey} onChange={(e) => setRunner(i, { jockey: e.target.value })} />
                  <FlagPicker label={`ธงจ็อกกี้เบอร์ ${h.number}`} value={h.jockeyCountry} onChange={(c) => setRunner(i, { jockeyCountry: c })} />
                </div>
              ))}
            </div>
            <div className="btns">
              <button className="btn" type="button" disabled={n >= MAX_RUNNERS} onClick={() => updateRace(race.id, (r) => ({ ...r, runners: [...r.runners, { number: Math.max(...r.runners.map((x) => x.number)) + 1, draw: null, name: "", jockey: "", horseCountry: "", jockeyCountry: "", fav: null, scratched: false }] }))}>+ เพิ่มม้า</button>
              <button className="btn" type="button" disabled={n <= MIN_RUNNERS} onClick={() => updateRace(race.id, (r) => { const runners = r.runners.slice(0, -1); return { ...r, runners, highlight: runners.some((x) => x.number === r.highlight) ? r.highlight : null }; })}>− ลบตัวท้าย</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="subpane" role="tabpanel" aria-labelledby="sub-style">
          <div className="group">
            <b>สีช่อง DRAW (ซอง)</b>
            <select aria-label="สีช่อง DRAW" value={S.drawScheme} onChange={(e) => setStyle((s) => ({ ...s, drawScheme: e.target.value as Scheme }))}>
              {(Object.keys(SCHEME_LABEL) as Scheme[]).map((k) => <option key={k} value={k}>{SCHEME_LABEL[k]}</option>)}
            </select>
            <Switch on={S.autoDraw} label="คำนวณเลขซองให้อัตโนมัติตามกฎ JRA" onToggle={() => setStyle((s) => ({ ...s, autoDraw: !s.autoDraw }))} />
          </div>
          <div className="group">
            <b>สีช่อง NO. (เบอร์)</b>
            <select aria-label="สีช่อง NO." value={S.numberScheme} onChange={(e) => setStyle((s) => ({ ...s, numberScheme: e.target.value as Scheme }))}>
              {(["plain", "jra", "us", "custom"] as Scheme[]).map((k) => <option key={k} value={k}>{NO_SCHEME_LABEL[k]}</option>)}
            </select>
          </div>
          {showCustom && (
            <div className="group">
              <b>ชุดสี Custom (สีพื้น / สีตัวเลข)</b>
              <div className="swatches">
                {Array.from({ length: Math.max(n, 8) }, (_, i) => i + 1).map((k) => {
                  const [bg, fg] = customPair(S, k);
                  const setPair = (p: [string, string]) => setStyle((s) => ({ ...s, customColors: { ...s.customColors, [k]: p } }));
                  return (
                    <div className="swatch" key={k}>
                      <span className="chip" style={{ background: bg, color: fg }}>{k}</span>
                      <input type="color" aria-label={`สีพื้นเบอร์ ${k}`} value={bg} onChange={(e) => setPair([e.target.value.toUpperCase(), fg])} />
                      <input type="color" aria-label={`สีตัวเลขเบอร์ ${k}`} value={fg} onChange={(e) => setPair([bg, e.target.value.toUpperCase()])} />
                    </div>
                  );
                })}
              </div>
              <div className="btns">
                <button className="btn" type="button" onClick={() => setStyle((s) => ({ ...s, customColors: Object.fromEntries(Object.entries(US).map(([k, v]) => [k, [...v] as [string, string]])) }))}>เริ่มจากสีอเมริกา</button>
              </div>
            </div>
          )}
          <div className="group">
            <b>ป้ายเกรด</b>
            <select aria-label="รูปแบบป้ายเกรด" value={S.gradeStyle} onChange={(e) => setStyle((s) => ({ ...s, gradeStyle: e.target.value as Style["gradeStyle"] }))}>
              <option value="jra">แบบญี่ปุ่น (GI / GII / GIII / LR)</option>
              <option value="intl">สากล (G1 / G2 / G3 / L)</option>
            </select>
          </div>
          <div className="group">
            <b>แสดงบนการ์ด</b>
            {([["draw", "ช่อง DRAW (ซอง)"], ["grade", "ป้ายเกรด"], ["class", "ป้าย Class"], ["fav", "ป้าย Fav (อันดับตัวเต็ง)"], ["horseFlag", "ธงชาติม้า"], ["jockeyFlag", "ธงชาติจ็อกกี้"], ["jpName", "ชื่อภาษาญี่ปุ่นบรรทัดบน"]] as const).map(([k, label]) => (
              <Switch key={k} on={S.show[k]} label={label} testId={`show-${k}`} onToggle={() => setStyle((s) => ({ ...s, show: { ...s.show, [k]: !s.show[k] } }))} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
