/** Sample data written on first open, so every page shows something straight away. Names are made up. */
import { HOME, newStyle, type AppData, type Race, type Runner } from "./model";

const NAMES = ["Morning Gallop", "Silver Paddock", "Northern Lantern", "Checkered Flag", "Royal Furlong", "Paper Owner", "Gate Seven", "Blue Silks", "Final Furlong", "Yellow Draw", "Navy Plate", "Turf Comet", "Night Rally", "Rising Second", "Cream Headline", "Long Stretch", "Photo Finish", "Last Corner"];
const JOCKEYS: [string, string][] = [["A. Sample", "JP"], ["B. Example", "JP"], ["C. Rider", "FR"], ["D. Jockey", "JP"], ["E. Saddle", "IT"], ["F. Whip", "JP"], ["G. Stirrup", "GB"], ["H. Reins", "JP"], ["I. Crop", "JP"], ["J. Girth", "IE"], ["K. Bridle", "JP"], ["L. Bit", "JP"], ["M. Halter", "DE"], ["N. Tack", "JP"], ["O. Visor", "JP"], ["P. Blinker", "JP"], ["Q. Hood", "FR"], ["R. Shoe", "JP"]];
const FAVS = [9, 4, 12, 1, 15, 7, 11, 3, 14, 2, 16, 8, 13, 6, 18, 5, 17, 10];
const HC: Record<number, string> = { 2: "GB", 4: "US", 6: "FR", 9: "AU", 13: "IE", 16: "AR" };

export const sampleRunner = (i: number): Runner => ({
  number: i + 1, draw: null, name: NAMES[i % NAMES.length], jockey: JOCKEYS[i % 18][0],
  horseCountry: HC[i] ?? "JP", jockeyCountry: JOCKEYS[i % 18][1], fav: FAVS[i] ?? null, scratched: false,
});

const race = (r: Omit<Race, "style" | "highlight" | "runners"> & { n: number }): Race => {
  const { n, ...rest } = r;
  return { ...rest, highlight: null, style: newStyle(), runners: Array.from({ length: n }, (_, i) => sampleRunner(i)) };
};

export function sampleData(): AppData {
  const r10 = race({ id: "sample-10", date: "2026-11-29", course: "Tokyo", round: "10R", postTime: "15:01", jpName: "", name: "Shimotsuki Stakes", subtitle: "", grade: null, jump: false, class: null, surface: "Dirt", distanceM: 2100, n: 14 });
  const r11 = race({ id: "sample-11", date: "2026-11-29", course: "Tokyo", round: "11R", postTime: "15:40", jpName: "第1回 サンプルカップ", name: "Sample Cup", subtitle: "Example race for the broadcast overlay", grade: "G1", jump: false, class: null, surface: "Turf", distanceM: 2400, n: 18 });
  const r12 = race({ id: "sample-12", date: "2026-11-29", course: "Tokyo", round: "12R", postTime: "16:30", jpName: "", name: "Sample Juvenile", subtitle: "", grade: "G3", jump: false, class: "2YO", surface: "Turf", distanceM: 1600, n: 12 });
  r11.runners[5].scratched = true;
  r11.highlight = 9;
  r10.style.drawScheme = "us";
  r10.style.numberScheme = "us";
  r10.style.show.draw = false;
  return { version: 1, races: [r10, r11, r12], active: r11.id, transition: "wipe", home: { title: "Tokyo Races", subtitle: "2026.11.29", highlight: null }, images: {} };
}

export { HOME };
