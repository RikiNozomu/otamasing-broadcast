/** A 1920x1080 stage scaled to its box, and the live scene with transitions between Active items. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { HOME, type Transition } from "../lib/model";
import { useData } from "../lib/store";
import { Card } from "./Card";
import { HomeList } from "./HomeList";

/** Scales its 1920x1080 child to the width of the parent box. */
export function Stage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / 1920);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className={"stage " + className} style={{ transform: `scale(${scale})` }}>{children}</div>;
}

/** What one Active value draws. A deleted race falls back to the home page. */
export function Scene({ id, scope }: { id: string; scope: string }) {
  const d = useData();
  const race = id === HOME ? undefined : d.races.find((r) => r.id === id);
  return race ? <Card race={race} scope={scope} /> : <HomeList scope={scope} />;
}

interface Layer { id: string; n: number; cls: string; leaving?: boolean }
const DURATION: Record<Transition, number> = { wipe: 800, slide: 700, fade: 500, none: 0 };
let seq = 0;

/** The live scene: when Active changes, the new scene animates in over the old one, then the old one is dropped. */
export function LiveScene() {
  const d = useData();
  const [layers, setLayers] = useState<Layer[]>(() => [{ id: d.active, n: seq++, cls: "" }]);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const t = d.transition, n = seq++;
    setLayers((ls) => {
      const top = ls[ls.length - 1];
      if (top.id === d.active) return ls;
      if (t === "none") return [{ id: d.active, n, cls: "" }];
      return [{ ...top, leaving: true, cls: t === "slide" ? "slide-out" : "" }, { id: d.active, n, cls: `${t}-in` }];
    });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLayers((ls) => ls.filter((l) => !l.leaving).map((l) => ({ ...l, cls: "" }))), DURATION[t] + 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a change of Active starts a transition
  }, [d.active]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const top = layers[layers.length - 1];
  const wiping = layers.length > 1 && top.cls === "wipe-in";
  return (
    <>
      {layers.map((l) => (
        <div key={l.n} className={"layer " + l.cls} data-active={l.leaving ? undefined : l.id}>
          <Scene id={l.id} scope={`live${l.n}`} />
        </div>
      ))}
      {wiping && <div key={`bar${top.n}`} className="wipebar" />}
    </>
  );
}
