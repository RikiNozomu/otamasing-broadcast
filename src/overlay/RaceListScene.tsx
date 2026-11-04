/** The home scene ("หน้าแรก"): every race in dock order, title + subtitle, optional background, one race highlighted. */
import { motion } from "motion/react";
import { GRADE_COLOR } from "../lib/colors";
import { gradeLabel } from "../lib/labels";
import { HOME_BG, useImage } from "../lib/images";
import { useData } from "../lib/store";
import { cx } from "../lib/cx";
import { Logo } from "../components/Logo";
import { HighlightBar, useHighlight } from "./Highlight";

const box = "flex items-center gap-[18px] overflow-hidden whitespace-nowrap px-[22px] font-display text-[40px] font-bold text-white";
const cell = cx(box, "bg-[linear-gradient(90deg,var(--color-band)_85%,rgb(44_48_96/.5))]");

export function RaceListScene() {
  const d = useData();
  const bg = useImage(HOME_BG, d.images[HOME_BG]);
  const races = d.races;
  const rowH = races.length <= 8 ? 78 : Math.max(44, Math.floor((1080 - 330) / races.length) - 14);
  const roundW = Math.max(110, ...races.map((x) => 44 + 24 * x.round.length));
  const cur = d.home.highlight && races.some((r) => r.id === d.home.highlight) ? d.home.highlight : null;
  const highlightOf = useHighlight(cur);
  return (
    <div className="absolute inset-0 bg-scene" data-testid="race-list">
      {bg && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${bg}")` }}>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_21_125/.92)_0%,rgb(0_21_125/.75)_60%,rgb(0_21_125/.55)_100%)]" />
        </div>
      )}
      <Logo className="absolute top-[30px] right-10 w-40" />
      <div className="absolute top-[70px] left-20 text-white">
        <div data-testid="home-subtitle" className="font-display text-[34px] leading-[normal] font-semibold tracking-[.06em] text-home-date">{d.home.subtitle}</div>
        <div data-testid="home-title" className="font-display text-[110px] leading-none font-bold uppercase">{d.home.title}</div>
      </div>
      <div className="absolute inset-x-20 top-[290px] grid gap-3.5">
        {races.map((x) => {
          const hl = highlightOf(x.id);
          return (
            <div key={x.id} data-testid="race-list-row" data-race={x.id} data-hl={hl.state} className="relative grid gap-2.5"
              style={{ height: rowH, gridTemplateColumns: `${roundW}px 150px minmax(0,1fr) 330px` }}>
              <HighlightBar on={hl.on} className="inset-y-0 right-0" style={{ left: roundW + 10 }} />
              <motion.span initial={false} {...hl.cell} className={cx(box, "justify-center bg-scene shadow-[inset_0_0_0_3px_#fff]")}>{x.round}</motion.span>
              <motion.span initial={false} {...hl.ink(false)} className={cx(cell, "justify-center tabular-nums")}><span className="relative">{x.postTime}</span></motion.span>
              <motion.span initial={false} {...hl.ink(false)} className={cell}>
                <span className="relative">{x.name.toUpperCase()}</span>
                {x.grade && x.style.show.grade ? (
                  <span className="relative inline-flex h-9 items-center rounded-full px-4 text-[26px] leading-none text-white" style={{ background: GRADE_COLOR[x.grade] }}>{gradeLabel(x, x.style)}</span>
                ) : null}
              </motion.span>
              <motion.span initial={false} {...hl.ink(true)} className={cx(cell, "justify-end text-[34px] font-semibold uppercase")}>
                <span className="relative">{[x.surface, x.distanceM ? x.distanceM + "m" : ""].filter(Boolean).join(" ")}</span>
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
