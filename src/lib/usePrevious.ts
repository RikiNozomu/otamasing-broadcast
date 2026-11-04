import { useRef } from "react";

/**
 * The value before the last change (kept until the next change, not just one render).
 * The highlight uses it to know which row the yellow bar just left.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<{ cur: T; prev: T | undefined }>({ cur: value, prev: undefined });
  if (ref.current.cur !== value) ref.current = { cur: value, prev: ref.current.cur };
  return ref.current.prev;
}
