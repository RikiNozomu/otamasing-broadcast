/** The one OBS Browser Source (1920x1080): shows whatever is Active in the dock. */
import { useEffect } from "react";
import { LiveScene, Stage } from "./Stage";

export function Overlay() {
  useEffect(() => { document.body.classList.add("is-overlay"); document.title = "โอตะม้าซิ่ง Broadcast · Overlay"; }, []);
  return (
    <div className="overlay-root">
      <Stage><LiveScene /></Stage>
    </div>
  );
}
