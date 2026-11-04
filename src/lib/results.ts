/**
 * What the result page lists and how it pages. Finishers come first in finishing order, then the horses
 * with a mark instead of a position: DNF (did not finish), DQ (disqualified), SCR (scratched).
 * At most RESULT_ROWS rows are on screen. Locked horses stay at the top of every page; the other rows
 * fill the remaining rows, page by page.
 * e.g. 17 finishers with 1st–3rd locked: page 1 = 1–3 + 4–10, page 2 = 1–3 + 11–17.
 */
import type { Race, Runner } from "./model";

export const RESULT_ROWS = 10;
/** At least one row is left for the horses that change with the page. */
export const MAX_LOCKS = RESULT_ROWS - 1;

export type ResultMark = "DNF" | "DQ" | "SCR";
const MARK_ORDER: ResultMark[] = ["DNF", "DQ", "SCR"];

/** The mark shown instead of a position, or null for a horse that finished (or has no result yet). */
export function resultMark(h: Pick<Runner, "scratched" | "outcome">): ResultMark | null {
  if (h.scratched) return "SCR";
  return h.outcome === "dnf" ? "DNF" : h.outcome === "dq" ? "DQ" : null;
}

/** Horses with a finishing position, in finishing order (dead heats by number). */
export function finishers(race: Pick<Race, "runners">): Runner[] {
  return race.runners
    .filter((h) => h.finish != null && !resultMark(h))
    .sort((a, b) => a.finish! - b.finish! || a.number - b.number);
}

/** Every horse on the result page: finishers, then DNF, DQ and SCR (each by number). Horses with no result are left out. */
export function resultEntries(race: Pick<Race, "runners">): Runner[] {
  const marked = MARK_ORDER.flatMap((m) => race.runners.filter((h) => resultMark(h) === m).sort((a, b) => a.number - b.number));
  return [...finishers(race), ...marked];
}

export interface ResultPage {
  /** Rows to draw, locked first. */
  rows: Runner[];
  locked: Set<number>;
  /** The page shown (0-based, clamped) and how many pages there are. */
  page: number;
  pageCount: number;
}

export function resultPage(race: Pick<Race, "runners" | "result">, page = race.result.page): ResultPage {
  const all = resultEntries(race);
  const want = new Set(race.result.locked);
  const lockedRows = all.filter((h) => want.has(h.number)).slice(0, MAX_LOCKS);
  const locked = new Set(lockedRows.map((h) => h.number));
  const rest = all.filter((h) => !locked.has(h.number));
  const slots = RESULT_ROWS - lockedRows.length;
  const pageCount = Math.max(1, Math.ceil(rest.length / slots));
  const p = Math.min(Math.max(0, page), pageCount - 1);
  return { rows: [...lockedRows, ...rest.slice(p * slots, (p + 1) * slots)], locked, page: p, pageCount };
}
