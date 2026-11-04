/**
 * Paging of the result page: at most RESULT_ROWS rows on screen. Locked horses stay at the top of
 * every page; the other finishers fill the remaining rows, page by page.
 * e.g. 17 finishers with 1st–3rd locked: page 1 = 1–3 + 4–10, page 2 = 1–3 + 11–17.
 */
import type { Race, Runner } from "./model";

export const RESULT_ROWS = 10;
/** At least one row is left for the horses that change with the page. */
export const MAX_LOCKS = RESULT_ROWS - 1;

/** Horses with a finishing position, in finishing order (dead heats by number). Scratched horses never appear. */
export function finishers(race: Pick<Race, "runners">): Runner[] {
  return race.runners
    .filter((h) => h.finish != null && !h.scratched)
    .sort((a, b) => a.finish! - b.finish! || a.number - b.number);
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
  const all = finishers(race);
  const want = new Set(race.result.locked);
  const lockedRows = all.filter((h) => want.has(h.number)).slice(0, MAX_LOCKS);
  const locked = new Set(lockedRows.map((h) => h.number));
  const rest = all.filter((h) => !locked.has(h.number));
  const slots = RESULT_ROWS - lockedRows.length;
  const pageCount = Math.max(1, Math.ceil(rest.length / slots));
  const p = Math.min(Math.max(0, page), pageCount - 1);
  return { rows: [...lockedRows, ...rest.slice(p * slots, (p + 1) * slots)], locked, page: p, pageCount };
}
