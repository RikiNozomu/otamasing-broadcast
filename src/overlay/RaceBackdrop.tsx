/**
 * What the racecard and the result page share: the photo on the left fading into navy before the table,
 * the logo top right, and the race title bottom left.
 */
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { CLASSES, type Race } from "../lib/model";
import { GRADE_COLOR } from "../lib/colors";
import { gradeLabel } from "../lib/labels";
import { useData } from "../lib/store";
import { raceImageKey, useImage } from "../lib/images";
import { cx } from "../lib/cx";
import { Logo } from "../components/Logo";

export const pill = "inline-flex items-center justify-center whitespace-nowrap rounded-full font-display font-bold leading-none [text-shadow:none]";

/** The photo fades into navy over 620px starting 240px left of the table, so it follows the table's width. */
export function RacePhoto({ race, tableL }: { race: Race; tableL: number }) {
  const data = useData();
  const key = raceImageKey(race.id);
  const photo = useImage(key, data.images[key]);
  const fadeL = tableL - 240;
  return (
    <>
      <div className={cx("absolute inset-y-0 left-0 bg-cover bg-center", !photo && "bg-[radial-gradient(70%_60%_at_35%_45%,#1d2f9e_0%,#0b1a86_50%,var(--color-scene)_100%)]")}
        style={{ width: fadeL + 600, backgroundImage: photo ? `url("${photo}")` : undefined }} />
      <div className="absolute inset-y-0 w-[620px] bg-[linear-gradient(90deg,rgb(0_21_125/0)_0%,rgb(0_21_125/.85)_70%,var(--color-scene)_100%)]" style={{ left: fadeL }} />
      <div className="absolute inset-x-0 bottom-0 h-[420px] bg-[linear-gradient(0deg,rgb(0_0_0/.55),rgb(0_0_0/0))]" />
      <Logo className="absolute top-[30px] right-10 w-40" />
    </>
  );
}

/** The title block bottom left; the race name shrinks until it fits in `maxWidth`. `tag` goes above it (e.g. RESULT). */
export function RaceTitle({ race, maxWidth, tag }: { race: Race; maxWidth: number; tag?: ReactNode }) {
  const S = race.style, show = S.show;
  const nameRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    let s = 150;
    el.style.fontSize = s + "px";
    while (el.scrollWidth > maxWidth && s > 60) { s -= 4; el.style.fontSize = s + "px"; }
  }, [race.name, maxWidth]);
  const cls = race.class ? CLASSES[race.class] : null;
  const showGrade = show.grade && race.grade, showClass = show.class && cls;
  const facts = [race.date.replaceAll("-", "."), race.round, race.course, race.surface, race.distanceM ? `${race.distanceM} meters` : ""].filter(Boolean).join(" ");
  return (
    <div className="absolute bottom-[46px] left-[57px] grid gap-0.5 text-white [text-shadow:0_2px_14px_rgb(0_0_0/.45)]">
      {tag}
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
  );
}
