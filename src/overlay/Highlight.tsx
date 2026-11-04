/**
 * The highlight shared by the racecard (one horse) and the race list (one race):
 * one yellow bar that grows left to right when it comes in and shrinks right to left when it leaves,
 * while the other rows fade to 60%. Nothing animates on the first draw of a scene, only on a change.
 */
import { AnimatePresence, motion, type Transition } from "motion/react";
import type { CSSProperties } from "react";
import { cx } from "../lib/cx";
import { usePrevious } from "../lib/usePrevious";

const BAR_EASE = [0.65, 0, 0.35, 1] as const;
export const NAVY = "#0A056B";

export function HighlightBar({ on, className, style }: { on: boolean; className?: string; style?: CSSProperties }) {
  return (
    <AnimatePresence initial={false}>
      {on && (
        <motion.span key="bar" aria-hidden="true" className={cx("absolute origin-left bg-yellow", className)} style={style}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }} transition={{ duration: 0.5, ease: BAR_EASE }} />
      )}
    </AnimatePresence>
  );
}

export interface RowHighlight {
  on: boolean;
  /** "on" for the highlighted row, "out" for the row the bar just left (also a test hook). */
  state: "on" | "out" | undefined;
  /** Motion props for every cell of the row: fade when another row is highlighted. */
  cell: { animate: { opacity: number }; transition: { opacity: Transition } };
  /** Motion props for a text cell that turns navy on the yellow bar; `late` = starts after the bar has passed it. */
  ink: (late: boolean) => { animate: { opacity: number; color: string }; transition: { opacity: Transition; color: Transition } };
}

/** Per-row highlight state for a list where `cur` is the highlighted id (or null). */
export function useHighlight<T>(cur: T | null): (id: T) => RowHighlight {
  const prev = usePrevious(cur);
  return (id) => {
    const on = cur != null && id === cur;
    const out = !on && prev != null && id === prev;
    const opacity = cur != null && !on ? 0.6 : 1;
    // when the highlight moves, the row it left fades only after its bar has gone
    const fade: Transition = out && cur != null ? { duration: 0.3, delay: 0.45 } : { duration: 0.4 };
    return {
      on,
      state: on ? "on" : out ? "out" : undefined,
      cell: { animate: { opacity }, transition: { opacity: fade } },
      ink: (late) => ({
        animate: { opacity, color: on ? NAVY : "#FFFFFF" },
        // IN: the text turns navy as the bar reaches it; OUT: back to white as the bar leaves it
        transition: { opacity: fade, color: { duration: 0.25, delay: on ? (late ? 0.25 : 0.1) : late ? 0.15 : 0 } },
      }),
    };
  };
}
