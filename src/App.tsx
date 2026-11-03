import { useEffect, useState } from "react";
import { Dock } from "./dock/Dock";
import { Home } from "./Home";
import { Overlay } from "./overlay/Overlay";

/** Hash routing, so GitHub Pages serves one index.html for every page. */
const route = () => location.hash.replace(/^#\/?/, "").split("?")[0];

export function App() {
  const [r, setR] = useState(route());
  useEffect(() => {
    const on = () => setR(route());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  if (r === "overlay") return <Overlay />;
  if (r === "dock") return <Dock />;
  return <Home />;
}
