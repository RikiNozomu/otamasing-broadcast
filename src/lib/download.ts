/**
 * Getting a JSON text out of the dock. The dock inside OBS (a custom browser dock) ignores normal browser
 * downloads, so the export panel offers three ways: a save dialog where the browser has one, a download,
 * and copying the text.
 */

type SavePicker = (o: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<{
  createWritable: () => Promise<{ write: (t: string) => Promise<void>; close: () => Promise<void> }>;
}>;

/** True inside OBS (its browser sets `window.obsstudio`). */
export const inObs = () => typeof window !== "undefined" && "obsstudio" in window;

/** Saves through the browser's download. Inside OBS this does nothing, hence `saveJson`. */
export function downloadJson(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Asks where to save with the "Save as" dialog when the browser has one, otherwise downloads. */
export async function saveJson(name: string, text: string): Promise<"saved" | "cancelled" | "downloaded"> {
  const pick = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (pick) {
    try {
      const file = await pick({ suggestedName: name, types: [{ description: "JSON", accept: { "application/json": [".json"] } }] });
      const w = await file.createWritable();
      await w.write(text);
      await w.close();
      return "saved";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelled";
      // no dialog available (e.g. blocked in this browser): fall back to a download
    }
  }
  downloadJson(name, text);
  return "downloaded";
}

/** Copies text; falls back to selecting a hidden textarea and `execCommand("copy")` where the Clipboard API is refused. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const t = document.createElement("textarea");
    t.value = text;
    t.setAttribute("readonly", "");
    t.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.append(t);
    t.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    t.remove();
    return ok;
  }
}
