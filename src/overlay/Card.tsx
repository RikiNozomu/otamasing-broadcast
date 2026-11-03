/** The racecard scene (1920x1080): photo left fading into navy, runner table right, title bottom-left. */
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { CLASSES, type Race, type Runner } from "../lib/model";
import { boxColors, drawOf, favColor, gradeLabel, GRADE_COLOR, ordinal } from "../lib/colors";
import { useData } from "../lib/store";
import { raceImageKey, useImage } from "../lib/images";
import { useHighlight } from "../lib/useHighlight";
import { Flag, Logo } from "./bits";

function Box({ colors, value }: { colors: readonly [string, string] | null; value: number }) {
  return colors
    ? <span className="box" style={{ background: colors[0], color: colors[1] }}>{value}</span>
    : <span className="box no-plain">{value}</span>;
}

export function Card({ race, scope = "live" }: { race: Race; scope?: string }) {
  const data = useData();
  const key = raceImageKey(race.id);
  const photo = useImage(key, data.images[key]);
  const S = race.style, show = S.show;
  const n = race.runners.length, two = n > 18, per = two ? Math.ceil(n / 2) : n;
  const bx = two ? 54 : 62;
  const hw = (two ? 230 : 290) + (show.fav ? 50 : 0) + (show.horseFlag ? 40 : 0) + (show.draw ? 0 : 40);
  const jw = two ? 230 : 290;
  const colW = [show.draw ? bx : null, bx, hw, jw].filter((x): x is number => x != null);
  const cols = colW.map((w) => w + "px").join(" ");
  const tableW = (two ? 2 : 1) * (colW.reduce((a, b) => a + b, 0) + (colW.length - 1) * 8) + (two ? 26 : 0);
  const right = two ? 30 : 192;
  const fadeL = Math.min(640, 1920 - tableW - right - 420);
  const hlx = (show.draw ? bx + 8 : 0) + bx + 8, hlw = hw + 8 + jw;
  const hl = useHighlight(`${scope}:${race.id}`, race.highlight);

  const nameRef = useRef<HTMLDivElement>(null);
  const maxName = 1920 - tableW - right - 57 - 50;
  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    let s = 150;
    el.style.fontSize = s + "px";
    while (el.scrollWidth > maxName && s > 60) { s -= 4; el.style.fontSize = s + "px"; }
  }, [race.name, maxName]);

  const row = (h: Runner) => {
    const d = drawOf(S, h.number, h.draw, n);
    const isHl = race.highlight === h.number;
    const cls = ["tr", h.scratched && "scr", isHl && "hl", isHl && hl.pop && "hl-anim", !isHl && hl.out === h.number && "hl-out"].filter(Boolean).join(" ");
    return (
      <div key={h.number} className={cls} style={{ gridTemplateColumns: cols, "--hlx": hlx + "px", "--hlw": hlw + "px" } as CSSProperties} data-no={h.number}>
        {show.draw && <Box colors={boxColors(S.drawScheme, d, h.number, n, S, false)} value={d} />}
        <Box colors={boxColors(S.numberScheme, h.number, h.number, n, S, true)} value={h.number} />
        <span className="band">
          {show.horseFlag && <Flag code={h.horseCountry} />}
          <span className="nm">{h.name.toUpperCase()}</span>
          {show.fav && h.fav && !h.scratched ? <span className="pill fav" style={{ background: favColor(h.fav) }}>{ordinal(h.fav)}</span> : null}
        </span>
        <span className="band jk">
          {show.jockeyFlag && <Flag code={h.jockeyCountry} />}
          <span className="nm">{h.jockey.toUpperCase()}</span>
        </span>
      </div>
    );
  };
  const chunks = two ? [race.runners.slice(0, per), race.runners.slice(per)] : [race.runners];
  const cls = race.class ? CLASSES[race.class] : null;
  const pills = (
    <>
      {show.grade && race.grade && <span className="pill" style={{ background: GRADE_COLOR[race.grade] }}>{gradeLabel(race, S)}</span>}
      {show.class && cls && <span className="pill" style={{ background: cls.color }}>{cls.label}</span>}
    </>
  );
  const hasPills = (show.grade && race.grade) || (show.class && cls);
  const facts = [race.date.replaceAll("-", "."), race.round, race.course, race.surface, race.distanceM ? `${race.distanceM} meters` : ""].filter(Boolean).join(" ");

  return (
    <div className="card" data-race={race.id}>
      <div className={"photo" + (photo ? "" : " ph")} style={{ width: fadeL + 600, backgroundImage: photo ? `url("${photo}")` : undefined }} />
      <div className="fade" style={{ left: fadeL }} />
      <div className="shade" />
      <Logo />
      <div className={"tbl" + hl.tableClass} style={{ right, top: two ? 128 : 108 }}>
        {chunks.map((c, i) => (
          <div className="colw" key={i}>
            <div className="th" style={{ gridTemplateColumns: cols }}>
              {show.draw && <span>DRAW</span>}<span>NO.</span><span>HORSE</span><span>JOCKEY</span>
            </div>
            {c.map(row)}
          </div>
        ))}
      </div>
      <div className="title">
        {(show.jpName && race.jpName) || hasPills ? <div className="jpline">{show.jpName && race.jpName}{pills}</div> : null}
        <div className="rname" ref={nameRef}>{race.name}</div>
        {race.subtitle && <div className="sub">{race.subtitle}</div>}
        <div className="sub">{facts}</div>
      </div>
    </div>
  );
}
