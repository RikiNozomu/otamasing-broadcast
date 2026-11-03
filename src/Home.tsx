/** Landing page (#/): what the two URLs are for, with a live preview. */
import { LiveScene, Stage } from "./overlay/Stage";

export function Home() {
  const base = `${location.origin}${location.pathname}`;
  return (
    <main className="landing">
      <header>
        <h1>โอตะม้าซิ่ง Broadcast</h1>
        <p>แผงควบคุมใน OBS (Custom Browser Dock) กับหน้าจอออกอากาศ (Browser Source) สำหรับรายชื่อม้าแข่งและรายการแข่งขัน ข้อมูลเก็บในเบราว์เซอร์ของเครื่องนี้เท่านั้น</p>
      </header>
      <div className="links">
        <div className="group"><b>Dock</b><span className="hint">OBS → Docks → Custom Browser Docks</span><a href="#/dock"><code>{base}#/dock</code></a></div>
        <div className="group"><b>Browser Source (1920×1080)</b><span className="hint">OBS → Sources → Browser</span><a href="#/overlay"><code>{base}#/overlay</code></a></div>
      </div>
      <div className="screen"><Stage><LiveScene /></Stage></div>
      <p className="hint">ข้อมูลใน OBS แยกจาก Chrome ปกติ ถ้าเตรียมข้อมูลใน Chrome ให้กดส่งออก JSON แล้วนำเข้าใน dock ของ OBS · รูปแบบไฟล์ JSON ดูได้ที่ <a href="https://github.com/RikiNozomu/otamasing-broadcast/blob/main/docs/race-json.md">docs/race-json.md</a></p>
    </main>
  );
}
