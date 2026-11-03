/** Tab "รายการแข่งขัน": pick Active (home or a race), import/export, order, delete, home page settings, URL. */
import { useRef, useState } from "react";
import { exportFile, HOME, mergeImport, newId, newStyle, parseFile, TRANSITIONS, type AppData, type Transition } from "../lib/model";
import { setData, update, useData, bumpImage } from "../lib/store";
import { deleteImage, HOME_BG, putImage, raceImageKey } from "../lib/images";
import { sampleRunner } from "../lib/sample";

const TRANSITION_LABEL: Record<Transition, string> = { wipe: "Wipe (แถบเหลืองกวาดจากซ้าย)", slide: "Slide (เลื่อนเข้าจากขวา)", fade: "Fade (จางเข้า)", none: "ไม่มี (ตัดทันที)" };

export function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const stamp = () => new Date().toISOString().slice(0, 10).replaceAll("-", "");

export function RacesTab({ onEdit, toast }: { onEdit: (id: string) => void; toast: (msg: string, bad?: boolean) => void }) {
  const d = useData();
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [pending, setPending] = useState<{ name: string; data: ReturnType<typeof parseFile> & { ok: true } } | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const overlayUrl = `${location.origin}${location.pathname}#/overlay`;

  const setActive = (id: string) => update((x) => ({ ...x, active: id }));
  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    const res = parseFile(await f.text());
    if (!res.ok) return toast(`นำเข้าไม่ได้: ${res.error}`, true);
    setPending({ name: f.name, data: res });
  };
  const doImport = (mode: "append" | "replace") => {
    if (!pending) return;
    const next = mergeImport(d, pending.data.data, mode);
    setData(next);
    toast(`นำเข้า ${pending.data.data.races.length} รายการแล้ว`);
    setPending(null);
  };
  const addRace = () => {
    const id = newId();
    update((x) => ({
      ...x,
      races: [...x.races, { id, date: new Date().toISOString().slice(0, 10), course: "", round: "", postTime: "", name: "New Race", jpName: "", subtitle: "", grade: null, jump: false, class: null, surface: "Turf", distanceM: null, highlight: null, style: newStyle(), runners: Array.from({ length: 8 }, (_, i) => ({ ...sampleRunner(i), name: `Horse ${i + 1}`, jockey: "", fav: null })) }],
    }));
    onEdit(id);
  };
  const remove = (id: string) => {
    update((x): AppData => ({
      ...x,
      races: x.races.filter((r) => r.id !== id),
      active: x.active === id ? HOME : x.active,
      home: { ...x.home, highlight: x.home.highlight === id ? null : x.home.highlight },
    }));
    deleteImage(raceImageKey(id)).catch(() => {});
    setConfirmDel(null);
  };
  const move = (from: number, to: number) => {
    if (from === to) return;
    update((x) => {
      const races = [...x.races];
      const [m] = races.splice(from, 1);
      races.splice(to, 0, m);
      return { ...x, races };
    });
  };
  const setBg = async (f: File | undefined) => {
    if (!f) return;
    await putImage(HOME_BG, f);
    bumpImage(HOME_BG);
  };
  const clearBg = async () => {
    await deleteImage(HOME_BG).catch(() => {});
    update((x) => { const images = { ...x.images }; delete images[HOME_BG]; return { ...x, images }; });
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(overlayUrl); toast("คัดลอก URL แล้ว"); }
    catch { toast("คัดลอกไม่ได้ ให้เลือกข้อความ URL แล้วคัดลอกเอง", true); }
  };
  const homeOn = d.active === HOME;

  return (
    <div className="pane" role="tabpanel" id="p-races" aria-labelledby="tab-races">
      <div className="btns">
        <button className="btn primary" type="button" onClick={() => fileRef.current?.click()}>นำเข้า JSON</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden data-testid="import-file" onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
        <button className="btn" type="button" onClick={() => download(`otamasing-broadcast-${stamp()}.json`, JSON.stringify(exportFile(d), null, 2))}>ส่งออก</button>
        <button className="btn" type="button" onClick={addRace}>+ เพิ่มเอง</button>
      </div>
      {pending && (
        <div className="confirm ok" role="alertdialog" aria-label="ยืนยันการนำเข้า">
          <span>{pending.name}: {pending.data.data.races.length} รายการ</span>
          <span className="btns">
            <button type="button" className="btn primary" onClick={() => doImport("append")}>เพิ่มต่อ</button>
            <button type="button" className="btn" onClick={() => doImport("replace")}>แทนที่ทั้งหมด</button>
            <button type="button" className="btn" onClick={() => setPending(null)}>ยกเลิก</button>
          </span>
        </div>
      )}
      <div className="list" data-testid="race-list">
        <div className="hrow">
          <span />
          <div className={"rc home" + (homeOn ? " on" : "")} data-id={HOME} onClick={() => setActive(HOME)}>
            <button type="button" className="pick" aria-pressed={homeOn} aria-label="ตั้งหน้าแรกเป็น Active" />
            <span className="r">HOME</span>
            <span className="t"><b>หน้าแรก · {d.home.title}</b><small>รายการแข่งขันทั้งหมด {d.races.length} รายการ{d.home.subtitle ? ` · ${d.home.subtitle}` : ""}</small></span>
            <span className="side"><span className="badge">ACTIVE</span></span>
          </div>
          <span />
        </div>
        {d.races.map((x, i) => confirmDel === x.id ? (
          <div className="confirm" key={x.id}>
            <span>ลบ {x.round} {x.name}? ลบแล้วกู้คืนไม่ได้</span>
            <span className="btns">
              <button type="button" className="btn danger" onClick={() => remove(x.id)}>ลบ</button>
              <button type="button" className="btn" onClick={() => setConfirmDel(null)}>ยกเลิก</button>
            </span>
          </div>
        ) : (
          <div
            key={x.id}
            className={"rrow" + (dragFrom === i ? " drag" : "") + (over === i && dragFrom !== null && dragFrom !== i ? " over" : "")}
            draggable
            onDragStart={(e) => { setDragFrom(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
            onDragOver={(e) => { if (dragFrom === null) return; e.preventDefault(); setOver(i); }}
            onDrop={(e) => { e.preventDefault(); if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); setOver(null); }}
            onDragEnd={() => { setDragFrom(null); setOver(null); }}
          >
            <span className="handle" aria-hidden="true">⠿</span>
            <div className={"rc" + (x.id === d.active ? " on" : "")} data-id={x.id} onClick={(e) => { if (!(e.target as HTMLElement).closest(".ebtn")) setActive(x.id); }}>
              <button type="button" className="pick" aria-pressed={x.id === d.active} aria-label={`ตั้ง ${x.round} ${x.name} เป็น Active`} />
              <span className="r">{x.round || "–"}</span>
              <span className="t"><b>{x.name}</b><small>{[x.date.replaceAll("-", "."), x.course, `${x.surface}${x.distanceM ? ` ${x.distanceM}m` : ""}`, `${x.runners.length} ตัว`].filter(Boolean).join(" · ")}</small></span>
              <span className="side"><span className="badge">ACTIVE</span><button type="button" className="btn ebtn" onClick={() => onEdit(x.id)}>แก้ไข</button></span>
            </div>
            <span className="moves">
              <button type="button" className="mv" aria-label={`เลื่อน ${x.round} ขึ้น`} disabled={i === 0} onClick={() => move(i, i - 1)}>▲</button>
              <button type="button" className="del" aria-label={`ลบ ${x.round} ${x.name}`} onClick={() => setConfirmDel(x.id)}>✕</button>
            </span>
          </div>
        ))}
      </div>
      <p className="hint">กด "หน้าแรก" หรือรายการไหนก็ได้เพื่อตั้งเป็น Active จอจะเปลี่ยนพร้อมทรานซิชัน · ลาก ⠿ (หรือกด ▲) เพื่อเรียงลำดับ หน้าแรกเรียงตามนี้ · ข้อมูลเก็บในเครื่องนี้ ย้ายเครื่องใช้ส่งออก/นำเข้า JSON</p>

      <div className="group">
        <label htmlFor="trans"><b>ทรานซิชันตอนเปลี่ยน Active</b></label>
        <select id="trans" value={d.transition} onChange={(e) => update((x) => ({ ...x, transition: e.target.value as Transition }))}>
          {TRANSITIONS.map((t) => <option key={t} value={t}>{TRANSITION_LABEL[t]}</option>)}
        </select>
      </div>

      <div className="group">
        <b>หน้าแรก (รายการแข่งขัน)</b>
        <div className="field"><label htmlFor="l-title">Title</label><input className="tx" id="l-title" value={d.home.title} onChange={(e) => update((x) => ({ ...x, home: { ...x.home, title: e.target.value } }))} /></div>
        <div className="field"><label htmlFor="l-sub">Sub title (วันที่)</label><input className="tx" id="l-sub" value={d.home.subtitle} onChange={(e) => update((x) => ({ ...x, home: { ...x.home, subtitle: e.target.value } }))} /></div>
        <div className="btns">
          <label className="btn primary" htmlFor="l-bg">เลือก BG…</label>
          <input type="file" id="l-bg" accept="image/*" hidden onChange={(e) => { setBg(e.target.files?.[0]); e.target.value = ""; }} />
          {d.images[HOME_BG] ? <button className="btn" type="button" onClick={clearBg}>ไม่ใช้รูป</button> : null}
        </div>
        <span className="hint">ไฮไลต์รายการบนหน้าแรก (แยกจาก Active, กดซ้ำเพื่อเอาออก)</span>
        <div className="lgrid">
          {d.races.map((x) => (
            <button key={x.id} type="button" className="hb" data-lh={x.id} aria-pressed={d.home.highlight === x.id} title={x.name}
              onClick={() => update((y) => ({ ...y, home: { ...y.home, highlight: y.home.highlight === x.id ? null : x.id } }))}>{x.round || x.name}</button>
          ))}
        </div>
      </div>

      <div className="group">
        <b>URL สำหรับ Browser Source ใน OBS</b>
        <div className="url"><code title={overlayUrl}>{overlayUrl}</code><button className="btn" type="button" onClick={copy}>คัดลอก</button></div>
        <span className="hint">ใส่ Browser Source ตัวเดียว ขนาด 1920×1080</span>
      </div>
    </div>
  );
}
