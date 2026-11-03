/** The OBS Custom Browser Dock: two tabs, รายการแข่งขัน and แก้ไข. */
import { useCallback, useEffect, useRef, useState } from "react";
import { HOME } from "../lib/model";
import { useData } from "../lib/store";
import { EditTab } from "./EditTab";
import { RacesTab } from "./RacesTab";

export function Dock() {
  const d = useData();
  const [tab, setTab] = useState<"races" | "edit">("races");
  const [editing, setEditing] = useState<string | null>(d.active !== HOME ? d.active : d.races[0]?.id ?? null);
  const [toastMsg, setToast] = useState<{ msg: string; bad: boolean } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const toast = useCallback((msg: string, bad = false) => {
    setToast({ msg, bad });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), bad ? 6000 : 2500);
  }, []);
  useEffect(() => { document.body.classList.add("is-dock"); document.title = "โอตะม้าซิ่ง Broadcast · Dock"; }, []);
  const active = d.races.find((r) => r.id === d.active);
  const tabs = [["races", "รายการแข่งขัน"], ["edit", "แก้ไข"]] as const;
  return (
    <div className="dock">
      <div className="dock-title"><span>โอตะม้าซิ่ง Broadcast</span><span data-testid="active-tag">Active: {active ? active.round || active.name : "หน้าแรก"}</span></div>
      <div className="tabs" role="tablist">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`p-${k}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      {tab === "races"
        ? <RacesTab toast={toast} onEdit={(id) => { setEditing(id); setTab("edit"); }} />
        : <EditTab editing={editing} setEditing={setEditing} />}
      {toastMsg && <div className={"toast" + (toastMsg.bad ? " bad" : "")} role={toastMsg.bad ? "alert" : "status"}>{toastMsg.msg}</div>}
    </div>
  );
}
