/** The racecard scene (1920x1080): photo left fading into navy, runner table right, title bottom-left. */
import { motion } from "motion/react";
import type { Race, Runner } from "../lib/model";
import { boxColors, drawOf, favColor } from "../lib/colors";
import { ordinal } from "../lib/labels";
import { cx } from "../lib/cx";
import { Flag } from "../components/Flag";
import { FitText } from "../components/FitText";
import { HighlightBar, useHighlight, type RowHighlight } from "./Highlight";
import { pill, RacePhoto, RaceTitle } from "./RaceBackdrop";

export const cell = "flex h-full items-center";
export const band = cx(cell, "gap-2.5 overflow-hidden whitespace-nowrap px-3.5 font-display text-[31px] bg-[linear-gradient(90deg,var(--color-band)_75%,rgb(44_48_96/0))]");

/** A DRAW or NO. box: coloured, or plain (white frame on navy). `hl` fades it with its row. */
export function NumberBox({ colors, value, hl }: { colors: readonly [string, string] | null; value: number; hl?: RowHighlight }) {
  return (
    <motion.span initial={false} {...hl?.cell}
      className={cx(cell, "justify-center font-display text-[32px] font-bold", !colors && "bg-scene text-white shadow-[inset_0_0_0_3px_#fff]")}
      style={colors ? { background: colors[0], color: colors[1] } : undefined}>
      {value}
    </motion.span>
  );
}

export function RacecardScene({ race }: { race: Race }) {
  const S = race.style, show = S.show;
  const n = race.runners.length, two = n > 18, per = two ? Math.ceil(n / 2) : n;
  // column widths in px at 1920x1080; the horse column grows for the flag and Fav pill
  const bx = two ? 54 : 62;
  const hw = (two ? 230 : 290) + (show.fav ? 50 : 0) + (show.horseFlag ? 40 : 0) + (show.draw ? 0 : 40);
  const jw = two ? 230 : 290;
  const colW = [show.draw ? bx : null, bx, hw, jw].filter((x): x is number => x != null);
  const cols = colW.map((w) => w + "px").join(" ");
  const tableW = (two ? 2 : 1) * (colW.reduce((a, b) => a + b, 0) + (colW.length - 1) * 8) + (two ? 26 : 0);
  const right = two ? 30 : 40;
  const tableL = 1920 - right - tableW;
  const barLeft = (show.draw ? bx + 8 : 0) + bx + 8, barWidth = hw + 8 + jw;
  const highlightOf = useHighlight(race.highlight);

  const row = (h: Runner) => {
    const d = drawOf(S, h.number, h.draw, n);
    const hl = highlightOf(h.number);
    return (
      <div key={h.number} data-no={h.number} data-hl={hl.state}
        className={cx("relative grid h-[47.5px] items-center gap-2 py-1", h.scratched && "opacity-40")} style={{ gridTemplateColumns: cols }}>
        <HighlightBar on={hl.on} className="top-1 h-12" style={{ left: barLeft, width: barWidth }} />
        {show.draw && <NumberBox colors={boxColors(S.drawScheme, d, h.number, n, S, false)} value={d} hl={hl} />}
        <NumberBox colors={boxColors(S.numberScheme, h.number, h.number, n, S, true)} value={h.number} hl={hl} />
        <motion.span data-testid="horse" initial={false} {...hl.ink(false)} className={cx(band, "font-bold")}>
          {show.horseFlag && <Flag code={h.horseCountry} className="relative h-[22px] w-[33px]" />}
          <FitText className="relative" strike={h.scratched}>{h.name.toUpperCase()}</FitText>
          {show.fav && h.fav && !h.scratched ? <span className={cx(pill, "relative h-6 flex-none px-[9px] text-[18px] text-scene")} style={{ background: favColor(h.fav) }}>{ordinal(h.fav)}</span> : null}
        </motion.span>
        <motion.span data-testid="jockey" initial={false} {...hl.ink(true)} className={cx(band, "font-medium")}>
          {show.jockeyFlag && <Flag code={h.jockeyCountry} className="relative h-[22px] w-[33px]" />}
          <FitText className="relative" strike={h.scratched}>{h.jockey.toUpperCase()}</FitText>
        </motion.span>
      </div>
    );
  };
  const columns = two ? [race.runners.slice(0, per), race.runners.slice(per)] : [race.runners];
  return (
    <div className="absolute inset-0 bg-scene" data-testid="racecard" data-race={race.id}>
      <RacePhoto photos={race.photos.card} tableL={tableL} />
      <div className="absolute grid grid-flow-col gap-x-[26px]" style={{ right, top: two ? 128 : 108 }}>
        {columns.map((c, i) => (
          <div className="grid content-start" key={i} data-testid="runner-column">
            <div data-testid="table-head" className="grid h-[42px] items-center gap-2 text-center font-display text-[21px] font-bold tracking-[.04em] text-white" style={{ gridTemplateColumns: cols }}>
              {show.draw && <span>DRAW</span>}<span>NO.</span><span>HORSE</span><span>JOCKEY</span>
            </div>
            {c.map(row)}
          </div>
        ))}
      </div>
      <RaceTitle race={race} maxWidth={tableL - 57 - 50} />
    </div>
  );
}
