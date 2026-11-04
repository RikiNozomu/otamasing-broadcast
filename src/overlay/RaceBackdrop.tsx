/**
 * What the racecard and the result page share: the photo on the left fading into navy before the table,
 * the logo top right, and the race title bottom left.
 */
import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { CLASSES, type PhotoSet, type Race } from "../lib/model";
import { GRADE_COLOR } from "../lib/colors";
import { gradeLabel } from "../lib/labels";
import { useData } from "../lib/store";
import { useImage } from "../lib/images";
import { useShownIndex } from "../lib/photos";
import { cx } from "../lib/cx";
import { Logo } from "../components/Logo";

export const pill = "inline-flex items-center justify-center whitespace-nowrap rounded-full font-display font-bold leading-none [text-shadow:none]";

/** One picture of the slideshow; it fades in once it has loaded (and out when the next one comes). */
function Picture({ k, rev, width }: { k: string; rev: number | undefined; width: number }) {
  const url = useImage(k, rev);
  return (
    <motion.div data-testid="photo" data-key={k} className="absolute inset-y-0 left-0 bg-cover bg-center"
      style={{ width, backgroundImage: url ? `url("${url}")` : undefined }}
      initial={{ opacity: 0 }} animate={{ opacity: url ? 1 : 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeInOut" }} />
  );
}

/**
 * The scene's pictures (a slideshow when there are several) fade into navy over 620px starting 240px
 * left of the table, so they follow the table's width. With no picture a blue glow stands in.
 */
export function RacePhoto({ photos, tableL }: { photos: PhotoSet; tableL: number }) {
  const data = useData();
  // pictures that are not in this browser (e.g. after importing a file) are skipped
  const set = { ...photos, keys: photos.keys.filter((k) => data.images[k]) };
  const i = useShownIndex(set);
  const key = i >= 0 ? set.keys[i] : null;
  const fadeL = tableL - 240;
  return (
    <>
      <div className="absolute inset-y-0 left-0 bg-[radial-gradient(70%_60%_at_35%_45%,#1d2f9e_0%,#0b1a86_50%,var(--color-scene)_100%)]" style={{ width: fadeL + 600 }} />
      <AnimatePresence initial={false}>
        {key && <Picture key={key} k={key} rev={data.images[key]} width={fadeL + 600} />}
      </AnimatePresence>
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
