/** Flag picker: a custom listbox with real flag images (a native <select> can't show pictures). */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NATIONS, nationCode, nationName } from "../lib/colors";
import { Flag } from "../overlay/bits";

export function FlagPicker({ value, onChange, label }: { value: string; onChange: (code: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={btn} type="button" className="fpick" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${nationName(value)}`} title={nationName(value)} onClick={() => setOpen((o) => !o)}>
        {value ? <Flag code={value} /> : <span className="noflag">–</span>}
        <span aria-hidden="true">▾</span>
      </button>
      {open && <FlagPopover anchor={btn.current!} value={value} onPick={(c) => { onChange(c); setOpen(false); btn.current?.focus(); }} onClose={() => { setOpen(false); btn.current?.focus(); }} />}
    </>
  );
}

function FlagPopover({ anchor, value, onPick, onClose }: { anchor: HTMLElement; value: string; onPick: (c: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const pop = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect(), h = pop.current?.offsetHeight ?? 300;
    const top = r.bottom + 4 + h > innerHeight ? r.top - 4 - h : r.bottom + 4;
    setPos({ left: Math.max(8, Math.min(r.left, innerWidth - 218)), top: Math.max(8, top) });
  }, [anchor]);
  useEffect(() => {
    const down = (e: MouseEvent) => { if (!pop.current?.contains(e.target as Node) && !anchor.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    // Scrolling the dock closes it; scrolling the list itself must not.
    const scroll = (e: Event) => { if (!pop.current?.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    addEventListener("scroll", scroll, true);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); removeEventListener("scroll", scroll, true); };
  }, [anchor, onClose]);
  const s = q.trim().toLowerCase();
  const opts: (readonly [string, string, string])[] = [...NATIONS, ["", "", "ไม่ใส่ธง"] as const].filter(
    ([c, k, n]) => !s || c.toLowerCase().includes(s) || k.toLowerCase().includes(s) || n.toLowerCase().includes(s),
  );
  return createPortal(
    <div ref={pop} className="fpop" style={pos}>
      <input className="tx" type="search" placeholder="ค้นหา เช่น ญี่ปุ่น, JPN" aria-label="ค้นหาประเทศ" value={q} autoFocus onChange={(e) => setQ(e.target.value)} />
      <div className="fopts" role="listbox" aria-label="ประเทศ">
        {opts.length ? opts.map(([c, , n]) => (
          <button key={c || "none"} type="button" className="fopt" role="option" aria-selected={c === value} data-c={c} onClick={() => onPick(c)}>
            {c ? <Flag code={c} /> : <span className="noflag">–</span>}<span>{n}</span><small>{c ? nationCode(c) : ""}</small>
          </button>
        )) : <span className="hint">ไม่พบประเทศ</span>}
      </div>
    </div>,
    document.body,
  );
}
