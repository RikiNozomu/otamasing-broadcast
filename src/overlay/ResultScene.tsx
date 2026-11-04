/**
 * The result scene (1920x1080): finishing order on the right, at most 10 rows per page.
 * Locked horses stay on top of every page with the yellow bar; on a page change the other rows
 * slide out to the left one after another and the next ones slide in from the right.
 */
import { AnimatePresence, motion } from "motion/react";
import type { Race, Runner } from "../lib/model";
import { boxColors, drawOf } from "../lib/colors";
import { ordinal } from "../lib/labels";
import { resultMark, resultPage } from "../lib/results";
import { cx } from "../lib/cx";
import { Flag } from "../components/Flag";
import { HighlightBar, NAVY } from "./Highlight";
import { band, cell, NumberBox } from "./RacecardScene";
import { RacePhoto, RaceTitle } from "./RaceBackdrop";

const ROW_H = 62;
const GAP = 8;
/** Space between the locked rows and the rows that change with the page. */
const LOCK_GAP = 10;
const EASE = [0.65, 0, 0.35, 1] as const;
const solid = cx(cell, "overflow-hidden whitespace-nowrap bg-band px-3.5 font-display text-[31px]");

/**
 * Text colour of a cell on a locked row: navy once the growing bar reaches it, white again as the
 * shrinking bar uncovers it. `at` = where the cell sits along the bar, 0 (left) to 1 (right).
 */
const ink = (locked: boolean, at: number) => ({
  initial: false as const,
  animate: { color: locked ? NAVY : "#FFFFFF" },
  transition: { color: locked ? { duration: 0.2, delay: 0.05 + at * 0.35 } : { duration: 0.2, delay: 0.05 + (1 - at) * 0.3 } },
});

export function ResultScene({ race, page }: { race: Race; page?: number }) {
  const S = race.style, show = S.show, n = race.runners.length;
  const { rows, locked } = resultPage(race, page);
  const pw = 96, bx = 62, tw = 130, mw = 120;
  const hw = 320 + (show.horseFlag ? 40 : 0) + (show.draw ? 0 : 40);
  const jw = 250 + (show.jockeyFlag ? 40 : 0);
  const colW = [pw, bx, show.draw ? bx : null, hw, jw, tw, mw].filter((x): x is number => x != null);
  const cols = colW.map((w) => w + "px").join(" ");
  const tableW = colW.reduce((a, b) => a + b, 0) + (colW.length - 1) * GAP;
  const right = 40;
  const tableL = 1920 - right - tableW;
  // the bar covers POS, then (after the coloured boxes) HORSE to MARGIN
  const textL = pw + GAP + bx + GAP + (show.draw ? bx + GAP : 0);
  const textW = tableW - textL;
  const lockedCount = rows.filter((h) => locked.has(h.number)).length;

  const row = (h: Runner, i: number) => {
    const on = locked.has(h.number);
    const mark = resultMark(h);
    const d = drawOf(S, h.number, h.draw, n);
    return (
      <motion.div key={h.number} data-no={h.number} data-locked={on ? "" : undefined} data-mark={mark ?? undefined} layout="position"
        initial={{ opacity: 0, x: 90 }}
        animate={{ opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE, delay: 0.25 + i * 0.045 } }}
        exit={{ opacity: 0, x: -90, transition: { duration: 0.25, ease: EASE, delay: i * 0.035 } }}
        transition={{ layout: { duration: 0.4, ease: EASE } }}
        className="relative grid items-center gap-2 py-1" style={{ height: ROW_H, gridTemplateColumns: cols, marginTop: i === lockedCount && lockedCount > 0 ? LOCK_GAP : 0 }}>
        <HighlightBar on={on} className="inset-y-1" style={{ left: 0, width: pw }} />
        <HighlightBar on={on} className="inset-y-1" style={{ left: textL, width: textW }} />
        <motion.span data-testid="pos" {...ink(on, 0)} className={cx(solid, "justify-center font-bold")}><span className="relative">{mark ?? ordinal(h.finish!)}</span></motion.span>
        <NumberBox colors={boxColors(S.numberScheme, h.number, h.number, n, S, true)} value={h.number} />
        {show.draw && <NumberBox colors={boxColors(S.drawScheme, d, h.number, n, S, false)} value={d} />}
        <motion.span data-testid="horse" {...ink(on, 0)} className={cx(band, "font-bold")}>
          {show.horseFlag && <Flag code={h.horseCountry} className="relative h-[22px] w-[33px]" />}
          <span className={cx("relative min-w-0 flex-1 overflow-hidden text-ellipsis", mark === "SCR" && "line-through decoration-[3px]")}>{h.name.toUpperCase()}</span>
        </motion.span>
        <motion.span data-testid="jockey" {...ink(on, 0.45)} className={cx(band, "font-medium")}>
          {show.jockeyFlag && <Flag code={h.jockeyCountry} className="relative h-[22px] w-[33px]" />}
          <span className="relative min-w-0 flex-1 overflow-hidden text-ellipsis">{h.jockey.toUpperCase()}</span>
        </motion.span>
        <motion.span data-testid="time" {...ink(on, 0.75)} className={cx(solid, "justify-center font-semibold")}><span className="relative">{mark ? "" : h.time}</span></motion.span>
        <motion.span data-testid="margin" {...ink(on, 0.9)} className={cx(solid, "justify-center font-semibold")}><span className="relative">{mark ? "" : h.margin}</span></motion.span>
      </motion.div>
    );
  };

  return (
    <div className="absolute inset-0 bg-scene" data-testid="result" data-race={race.id}>
      <RacePhoto race={race} tableL={tableL} />
      <div className="absolute grid content-start" style={{ right, top: 108, width: tableW }}>
        <div data-testid="table-head" className="grid h-[42px] items-center gap-2 text-center font-display text-[21px] font-bold tracking-[.04em] text-white" style={{ gridTemplateColumns: cols }}>
          <span>POS</span><span>NO.</span>{show.draw && <span>DRAW</span>}<span>HORSE</span><span>JOCKEY</span><span>TIME</span><span>MARGIN</span>
        </div>
        <div className="relative grid content-start" data-testid="result-rows">
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map(row)}
          </AnimatePresence>
          {rows.length === 0 && <div className="py-6 text-center font-display text-[34px] font-semibold text-white/70 uppercase">Result to follow</div>}
        </div>
      </div>
      <RaceTitle race={race} maxWidth={tableL - 57 - 50}
        tag={<span data-testid="result-tag" className="mb-2 w-fit bg-yellow px-4 py-1 font-display text-[30px] leading-none font-bold tracking-[.08em] text-navy [text-shadow:none]">RESULT</span>} />
    </div>
  );
}
