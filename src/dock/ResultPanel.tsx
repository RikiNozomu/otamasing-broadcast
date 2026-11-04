/**
 * Sub-tab "ผล" of the edit tab: enter the finishing position (or DNF / DQ / SCR), time and margin of each horse,
 * lock horses to the top of every page, and pick the page shown on screen.
 */
import { useState } from "react";
import { MAX_RUNNERS, type Race, type ResultView, type Runner } from "../lib/model";
import { MAX_LOCKS, RESULT_ROWS, resultEntries, resultMark, resultPage } from "../lib/results";
import { getData, updateRace } from "../lib/store";
import { cx } from "../lib/cx";
import { Button } from "../components/Button";
import { inputClass } from "../components/Field";
import { Section, hintClass } from "../components/Section";

/** Rows in result order (finishers, DNF, DQ, SCR), then the horses with no result yet by number. */
const byFinish = (race: Race) => {
  const shown = resultEntries(race).map((h) => h.number);
  return [...shown, ...race.runners.map((h) => h.number).filter((no) => !shown.includes(no))];
};
type Status = "" | "dnf" | "dq" | "scr";
const STATUS: [Status, string][] = [["", "–"], ["dnf", "DNF"], ["dq", "DQ"], ["scr", "SCR"]];

export function ResultPanel({ race }: { race: Race }) {
  // The list is re-sorted when a position field loses focus, not while typing, so the row being edited stays put.
  const [order, setOrder] = useState<{ id: string; numbers: number[] }>(() => ({ id: race.id, numbers: byFinish(race) }));
  const numbers = order.id === race.id ? order.numbers : byFinish(race);
  const resort = () => {
    const fresh = getData().races.find((r) => r.id === race.id) ?? race;
    setOrder({ id: race.id, numbers: byFinish(fresh) });
  };
  const rows = [
    ...numbers.map((no) => race.runners.find((h) => h.number === no)).filter((h): h is Runner => !!h),
    ...race.runners.filter((h) => !numbers.includes(h.number)),
  ];

  const setRunner = (no: number, patch: Partial<Runner>) =>
    updateRace(race.id, (r) => ({
      ...r,
      runners: r.runners.map((h) => (h.number === no ? { ...h, ...patch } : h)),
      // a scratched horse can't stay highlighted on the racecard
      highlight: patch.scratched && r.highlight === no ? null : r.highlight,
    }));
  const setStatus = (no: number, st: Status) =>
    setRunner(no, st === "" ? { scratched: false, outcome: null } : st === "scr" ? { scratched: true, outcome: null, finish: null } : { scratched: false, outcome: st, finish: null });
  const setView = (fn: (v: ResultView) => ResultView) => updateRace(race.id, (r) => ({ ...r, result: fn(r.result) }));

  const page = resultPage(race);
  const shown = resultEntries(race);
  const lockedCount = page.locked.size;
  const grid = "grid grid-cols-[38px_40px_54px_minmax(0,1fr)_60px_46px] items-center gap-1 text-xs";

  return (
    <div className="grid gap-3" role="tabpanel" aria-labelledby="sub-result">
      <Section title="หน้าที่แสดงบนจอ">
        <div className="flex flex-wrap gap-1" role="group" aria-label="เลือกหน้าผล">
          {Array.from({ length: page.pageCount }, (_, i) => (
            <button key={i} type="button" data-page={i + 1} aria-pressed={page.page === i}
              className={cx("border-2 px-3 py-[3px] font-display text-[17px] font-bold", page.page === i ? "border-yellow bg-yellow text-navy" : "border-white bg-navy text-white")}
              onClick={() => setView((v) => ({ ...v, page: i }))}>หน้า {i + 1}</button>
          ))}
        </div>
        <span className={hintClass}>
          หน้าละ {RESULT_ROWS} แถว · ขึ้นจอ {shown.length} ตัว · ล็อค {lockedCount} ตัว (อยู่บนสุดทุกหน้า แถบเหลือง) ที่เหลือเปลี่ยนตามหน้าทีละ {RESULT_ROWS - lockedCount} แถว
        </span>
      </Section>

      <Section title="ผลการแข่งขัน">
        <div className={cx(grid, "text-[11px] text-ink-muted")} aria-hidden="true"><span>ล็อค</span><span>อันดับ</span><span>สถานะ</span><span>ม้า</span><span>เวลา</span><span>ระยะห่าง</span></div>
        <div className="grid gap-1" data-testid="result-rows-edit">
          {rows.map((h) => {
            const mark = resultMark(h);
            const onScreen = mark != null || h.finish != null;
            const locked = race.result.locked.includes(h.number) && onScreen;
            const full = lockedCount >= MAX_LOCKS && !locked;
            const status: Status = h.scratched ? "scr" : h.outcome ?? "";
            return (
              <div key={h.number} className={cx(grid, "border-b border-line pb-1")} data-result-no={h.number}>
                <button type="button" aria-pressed={locked} aria-label={`ล็อคเบอร์ ${h.number}`} disabled={!onScreen || full}
                  title={full ? `ล็อคได้สูงสุด ${MAX_LOCKS} ตัว` : !onScreen ? "ใส่อันดับหรือสถานะก่อน" : undefined}
                  className={cx("h-full border text-[11px] font-semibold disabled:opacity-30", locked ? "border-yellow bg-yellow text-navy" : "border-line bg-studio text-ink-muted")}
                  onClick={() => setView((v) => ({ ...v, locked: locked ? v.locked.filter((x) => x !== h.number) : [...v.locked.filter((x) => x !== h.number), h.number] }))}>
                  {locked ? "ล็อค" : "–"}
                </button>
                <input className={cx(inputClass, "px-1 text-center disabled:opacity-30")} type="number" min={1} max={MAX_RUNNERS} aria-label={`อันดับเบอร์ ${h.number}`}
                  value={mark ? "" : h.finish ?? ""} disabled={!!mark} onBlur={resort}
                  onChange={(e) => setRunner(h.number, { finish: e.target.value ? Math.min(MAX_RUNNERS, Math.max(1, Math.round(+e.target.value))) : null })} />
                <select className={cx(inputClass, "px-0.5", status && "border-yellow! text-yellow!")} aria-label={`สถานะเบอร์ ${h.number}`} value={status}
                  onChange={(e) => { setStatus(h.number, e.target.value as Status); resort(); }}>
                  {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="w-[26px] flex-none bg-navy py-[3px] text-center font-display text-[15px] font-bold">{h.number}</span>
                  <span className={cx("truncate font-display text-[15px] font-bold uppercase", h.scratched && "line-through")}>{h.name || "–"}</span>
                </span>
                <input className={cx(inputClass, "px-1 disabled:opacity-30")} disabled={!!mark} aria-label={`เวลาเบอร์ ${h.number}`} placeholder="1:56.7" value={h.time} onChange={(e) => setRunner(h.number, { time: e.target.value })} />
                <input className={cx(inputClass, "px-1 disabled:opacity-30")} disabled={!!mark} aria-label={`ระยะห่างเบอร์ ${h.number}`} placeholder="1¼" value={h.margin} onChange={(e) => setRunner(h.number, { margin: e.target.value })} />
              </div>
            );
          })}
        </div>
        <span className={hintClass}>สถานะ: DNF = วิ่งไม่จบ, DQ = ถูกตัดสิทธิ์, SCR = ถอนตัว (ตรงกับช่อง "ถอน" ในแท็บข้อมูล) ขึ้นต่อท้ายผู้เข้าเส้นชัยตามลำดับนี้ · ระยะห่างพิมพ์ได้อิสระ เช่น 1¼, ½, nk, hd, nse · ม้าที่ไม่มีอันดับและไม่มีสถานะจะไม่ขึ้นจอ · อันดับเท่ากัน (dead heat) ใส่เลขซ้ำได้</span>
        <div className="flex flex-wrap gap-1.5">
          <Button onClick={resort}>เรียงตามอันดับ</Button>
          <Button disabled={!race.result.locked.length} onClick={() => setView((v) => ({ ...v, locked: [] }))}>ปลดล็อคทั้งหมด</Button>
        </div>
      </Section>
    </div>
  );
}
