import { useRef } from "react";

export interface HighlightAnim<T> {
  /** The highlight just changed in this mounted scene: play the IN animation on `cur`. */
  pop: boolean;
  /** Previous highlight, which plays the OUT animation. */
  out: T | null;
  /** Class for the table: has-hl (something highlighted) + dim-in / dim-out / moved while changing. */
  tableClass: string;
}

/**
 * Tracks the highlighted item of one scene so the yellow bar animates only when it changes,
 * not on the first draw or when other data changes. The result is kept until the next change,
 * so later re-renders keep the same classes and do not restart the CSS animations.
 */
export function useHighlight<T>(scope: string, cur: T | null): HighlightAnim<T> {
  const ref = useRef<{ scope: string; last: T | null; res: HighlightAnim<T> } | null>(null);
  const has = cur != null ? " has-hl" : "";
  if (!ref.current || ref.current.scope !== scope) {
    ref.current = { scope, last: cur, res: { pop: false, out: null, tableClass: has } };
  } else if (ref.current.last !== cur) {
    const prev = ref.current.last;
    const kind = prev == null ? " dim-in" : cur == null ? " dim-out" : " moved";
    ref.current = { scope, last: cur, res: { pop: cur != null, out: prev, tableClass: has + kind } };
  }
  return ref.current.res;
}
