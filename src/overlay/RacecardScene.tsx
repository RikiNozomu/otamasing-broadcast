/** The racecard scene (1920x1080): photo left fading into navy, runner table right, title bottom-left. */
import { motion } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import { CLASSES, type Race, type Runner } from "../lib/model";
import { boxColors, drawOf, favColor, GRADE_COLOR } from "../lib/colors";
import { gradeLabel, ordinal } from "../lib/labels";
import { useData } from "../lib/store";
import { raceImageKey, useImage } from "../lib/images";
import { cx } from "../lib/cx";
import { Flag } from "../components/Flag";
import { Logo } from "../components/Logo";
import { HighlightBar, useHighlight, type RowHighlight } from "./Highlight";

const pill = "inline-flex items-center justify-center whitespace-nowrap rounded-full font-display font-bold leading-none [text-shadow:none]";
const cell = "flex h-full items-center";
const band = cx(cell, "gap-2.5 overflow-hidden whitespace-nowrap px-3.5 font-display text-[31px] bg-[linear-gradient(90deg,var(--color-band)_75%,rgb(44_48_96/0))]");

/** A DRAW or NO. box: coloured, or plain (white frame on navy). */
function NumberBox({ colors, value, hl }: { colors: readonly [string, string] | null; value: number; hl: RowHighlight }) {
  return (
    <motion.span initial={false} {...hl.cell}
      className={cx(cell, "justify-center font-display text-[32px] font-bold", !colors && "bg-scene text-white shadow-[inset_0_0_0_3px_#fff]")}
      style={colors ? { background: colors[0], color: colors[1] } : undefined}>
      {value}
    </motion.span>
  );
}

export function RacecardScene({ race }: { race: Race }) {
  const data = useData();
  const key = raceImageKey(race.id);
  const photo = useImage(key, data.images[key]);
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
  // the photo fades into navy over 620px starting 240px left of the table, so it follows the table's width
  const tableL = 1920 - right - tableW;
  const fadeL = tableL - 240;
  const barLeft = (show.draw ? bx + 8 : 0) + bx + 8, barWidth = hw + 8 + jw;
  const highlightOf = useHighlight(race.highlight);

  // shrink the race name until it fits left of the table
  const nameRef = useRef<HTMLDivElement>(null);
  const maxName = 1920 - tableW - right - 57 - 50;
  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    let s = 150;
    el.style.fontSize = s + "px";
    while (el.scrollWidth > maxName && s > 60) { s -= 4; el.style.fontSize = s + "px"; }
  }, [race.name, maxName]);

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
          <span className={cx("relative min-w-0 flex-1 overflow-hidden text-ellipsis", h.scratched && "line-through decoration-[3px]")}>{h.name.toUpperCase()}</span>
          {show.fav && h.fav && !h.scratched ? <span className={cx(pill, "relative h-6 flex-none px-[9px] text-[18px] text-scene")} style={{ background: favColor(h.fav) }}>{ordinal(h.fav)}</span> : null}
        </motion.span>
        <motion.span data-testid="jockey" initial={false} {...hl.ink(true)} className={cx(band, "font-medium")}>
          {show.jockeyFlag && <Flag code={h.jockeyCountry} className="relative h-[22px] w-[33px]" />}
          <span className={cx("relative min-w-0 flex-1 overflow-hidden text-ellipsis", h.scratched && "line-through decoration-[3px]")}>{h.jockey.toUpperCase()}</span>
        </motion.span>
      </div>
    );
  };
  const columns = two ? [race.runners.slice(0, per), race.runners.slice(per)] : [race.runners];
  const cls = race.class ? CLASSES[race.class] : null;
  const showGrade = show.grade && race.grade, showClass = show.class && cls;
  const facts = [race.date.replaceAll("-", "."), race.round, race.course, race.surface, race.distanceM ? `${race.distanceM} meters` : ""].filter(Boolean).join(" ");

  return (
    <div className="absolute inset-0 bg-scene" data-testid="racecard" data-race={race.id}>
      <div className={cx("absolute inset-y-0 left-0 bg-cover bg-center", !photo && "bg-[radial-gradient(70%_60%_at_35%_45%,#1d2f9e_0%,#0b1a86_50%,var(--color-scene)_100%)]")}
        style={{ width: fadeL + 600, backgroundImage: photo ? `url("${photo}")` : undefined }} />
      <div className="absolute inset-y-0 w-[620px] bg-[linear-gradient(90deg,rgb(0_21_125/0)_0%,rgb(0_21_125/.85)_70%,var(--color-scene)_100%)]" style={{ left: fadeL }} />
      <div className="absolute inset-x-0 bottom-0 h-[420px] bg-[linear-gradient(0deg,rgb(0_0_0/.55),rgb(0_0_0/0))]" />
      <Logo className="absolute top-[30px] right-10 w-40" />
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
      <div className="absolute bottom-[46px] left-[57px] grid gap-0.5 text-white [text-shadow:0_2px_14px_rgb(0_0_0/.45)]">
        {(show.jpName && race.jpName) || showGrade || showClass ? (
          <div className="flex items-center gap-4 font-body text-[38px] leading-[normal] font-semibold">
            {show.jpName && race.jpName}
            {showGrade && <span className={cx(pill, "h-9 px-[18px] text-[26px] text-white")} style={{ background: GRADE_COLOR[race.grade!] }}>{gradeLabel(race, S)}</span>}
            {showClass && <span className={cx(pill, "h-9 px-[18px] text-[26px] text-white")} style={{ background: cls.color }}>{cls.label}</span>}
          </div>
        ) : null}
        <div ref={nameRef} data-testid="race-name" className="font-display text-[150px] leading-[.92] font-bold tracking-[-.005em] whitespace-nowrap uppercase">{race.name}</div>
        {race.subtitle && <div className="font-display text-[34px] leading-[1.25] font-semibold uppercase">{race.subtitle}</div>}
        <div data-testid="race-facts" className="font-display text-[34px] leading-[1.25] font-semibold uppercase">{facts}</div>
      </div>
    </div>
  );
}
