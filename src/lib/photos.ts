/** The slideshow of a scene's left-hand pictures: which one is on screen, and the dock's changes to it. */
import { useEffect, useState } from "react";
import type { PhotoSet } from "./model";

/** Index of the picture on screen at `now` (-1 when there is none). Pictures not in this browser are skipped by the caller. */
export function shownIndex(set: PhotoSet, now = Date.now()): number {
  const n = set.keys.length;
  if (!n) return -1;
  let i = set.index;
  if (set.auto && n > 1) i += Math.floor(Math.max(0, now - set.since) / (set.seconds * 1000));
  return ((i % n) + n) % n;
}

/** Show picture `i` from now on (an auto slideshow carries on from it). */
export const showPhoto = (set: PhotoSet, i: number, now = Date.now()): PhotoSet => {
  const n = set.keys.length;
  return { ...set, index: n ? ((i % n) + n) % n : 0, since: now };
};

/** Turn the slideshow on or off, or change its speed, without jumping to another picture. */
export const setAuto = (set: PhotoSet, patch: Partial<Pick<PhotoSet, "auto" | "seconds">>, now = Date.now()): PhotoSet =>
  ({ ...set, ...patch, index: Math.max(0, shownIndex(set, now)), since: now });

/** The index on screen, re-rendering when an auto slideshow moves on. */
export function useShownIndex(set: PhotoSet): number {
  const [now, setNow] = useState(Date.now);
  const i = shownIndex(set, now);
  useEffect(() => {
    if (!set.auto || set.keys.length < 2) return;
    const ms = set.seconds * 1000;
    const wait = ms - ((Date.now() - set.since) % ms) + 5;
    const t = window.setTimeout(() => setNow(Date.now()), Math.max(50, wait));
    return () => window.clearTimeout(t);
  }, [set.auto, set.keys.length, set.seconds, set.since, now]);
  // a change from the dock (new since) must be read straight away
  useEffect(() => setNow(Date.now()), [set.index, set.since]);
  return i;
}
