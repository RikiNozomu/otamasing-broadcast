/**
 * Getting a JSON text out of the dock. The dock inside OBS (a custom browser dock) ignores normal browser
 * downloads, so the export panel offers three ways: a save dialog where the browser has one, a download,
 * and copying the text.
 */

type SavePicker = (o: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<{
  createWritable: () => Promise<{ write: (t: string) => Promise<void>; close: () => Promise<void> }>;
  getFile: () => Promise<File>;
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

/**
 * Asks where to save with the "Save as" dialog when the browser has one, otherwise downloads.
 * "failed": the dialog made the file but writing it did not work (OBS's browser leaves an empty
 * file this way), so the caller must say so; the dock inside OBS does not offer saving at all.
 */
export async function saveJson(name: string, text: string): Promise<"saved" | "cancelled" | "downloaded" | "failed"> {
  const pick = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (!pick) {
    downloadJson(name, text);
    return "downloaded";
  }
  let file: Awaited<ReturnType<SavePicker>>;
  try {
    file = await pick({ suggestedName: name, types: [{ description: "JSON", accept: { "application/json": [".json"] } }] });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return "cancelled";
    // no dialog in this browser after all: download instead
    downloadJson(name, text);
    return "downloaded";
  }
  try {
    const w = await file.createWritable();
    await w.write(text);
    await w.close();
    // make sure the whole text is in the file (an aborted write leaves it empty)
    const saved = await file.getFile();
    return saved.size === new Blob([text]).size ? "saved" : "failed";
  } catch {
    return "failed";
  }
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
