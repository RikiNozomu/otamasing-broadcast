/** The home scene: every race in dock order, title + subtitle, optional background, one race highlighted. */
import type { CSSProperties } from "react";
import { gradeLabel, GRADE_COLOR } from "../lib/colors";
import { HOME_BG, useImage } from "../lib/images";
import { useData } from "../lib/store";
import { useHighlight } from "../lib/useHighlight";
import { Logo } from "./bits";

export function HomeList({ scope = "live" }: { scope?: string }) {
  const d = useData();
  const bg = useImage(HOME_BG, d.images[HOME_BG]);
  const races = d.races;
  const rh = races.length <= 8 ? 78 : Math.max(44, Math.floor((1080 - 330) / races.length) - 14);
  const rw = Math.max(110, ...races.map((x) => 44 + 24 * x.round.length));
  const cur = d.home.highlight && races.some((r) => r.id === d.home.highlight) ? d.home.highlight : null;
  const hl = useHighlight(`${scope}:home`, cur);
  return (
    <div className="rl-card">
      {bg && <div className="rl-bg" style={{ backgroundImage: `url("${bg}")` }} />}
      <Logo />
      <div className="rl-head"><div className="d">{d.home.subtitle}</div><div className="c">{d.home.title}</div></div>
      <div className={"rl" + hl.tableClass} style={{ "--rh": rh + "px" } as CSSProperties}>
        {races.map((x) => {
          const on = x.id === cur;
          const cls = ["rr", on && "hl", on && hl.pop && "hl-anim", !on && hl.out === x.id && "hl-out"].filter(Boolean).join(" ");
          return (
            <div key={x.id} className={cls} data-race={x.id} style={{ gridTemplateColumns: `${rw}px 150px minmax(0,1fr) 330px`, "--hlx": rw + 10 + "px" } as CSSProperties}>
              <span className="r">{x.round}</span>
              <span className="t"><span>{x.postTime}</span></span>
              <span>
                <span>{x.name.toUpperCase()}</span>
                {x.grade && x.style.show.grade ? <span className="pill" style={{ background: GRADE_COLOR[x.grade] }}>{gradeLabel(x, x.style)}</span> : null}
              </span>
              <span className="s"><span>{[x.surface, x.distanceM ? x.distanceM + "m" : ""].filter(Boolean).join(" ")}</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
