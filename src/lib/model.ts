/**
 * Data model and the JSON file format (docs/race-json.md, schema/race.schema.json).
 * Everything the dock edits lives in one AppData object in localStorage; pictures live in IndexedDB.
 * The import schema fills defaults, so a hand-written file only needs the race facts and runners.
 */
import { z } from "zod";

export const MAX_RUNNERS = 30;
export const MIN_RUNNERS = 2;

export const SCHEMES = ["jra", "us", "plain", "custom"] as const;
export type Scheme = (typeof SCHEMES)[number];
export const TRANSITIONS = ["wipe", "slide", "fade", "none"] as const;
export type Transition = (typeof TRANSITIONS)[number];
export const GRADES = ["G1", "G2", "G3", "L"] as const;
export type Grade = (typeof GRADES)[number];
/** Race class pills: label and colour (blue for age, pink for fillies/mares). */
export const CLASSES = {
  "2YO": { label: "2YO", color: "#3F5AB0" },
  "2YO_F": { label: "2YO", color: "#DF6FA3" },
  "3YO": { label: "3YO", color: "#3F5AB0" },
  FM: { label: "F&M", color: "#DF6FA3" },
} as const;
export type RaceClass = keyof typeof CLASSES;
export const SURFACES = ["Turf", "Dirt", "Jump"] as const;

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "สีต้องเป็น #RRGGBB");
/** ISO 3166 alpha-2 code ("JP", "GB"...) or "" for no flag. */
const country = z.union([z.string().regex(/^[A-Z]{2}$/, "รหัสประเทศต้องเป็นตัวพิมพ์ใหญ่ 2 ตัว เช่น JP"), z.literal("")]);

export const RunnerSchema = z.object({
  number: z.number().int().min(1).max(MAX_RUNNERS),
  draw: z.number().int().min(1).max(MAX_RUNNERS).nullable().default(null),
  name: z.string().default(""),
  jockey: z.string().default(""),
  horseCountry: country.default(""),
  jockeyCountry: country.default(""),
  fav: z.number().int().min(1).max(MAX_RUNNERS).nullable().default(null),
  scratched: z.boolean().default(false),
});
export type Runner = z.infer<typeof RunnerSchema>;

export const ShowSchema = z.object({
  draw: z.boolean().default(true),
  grade: z.boolean().default(true),
  class: z.boolean().default(true),
  fav: z.boolean().default(true),
  horseFlag: z.boolean().default(true),
  jockeyFlag: z.boolean().default(true),
  jpName: z.boolean().default(true),
});

export const StyleSchema = z.object({
  drawScheme: z.enum(SCHEMES).default("jra"),
  numberScheme: z.enum(SCHEMES).default("plain"),
  autoDraw: z.boolean().default(true),
  gradeStyle: z.enum(["jra", "intl"]).default("jra"),
  show: ShowSchema.default({}),
  /** Custom scheme colours by number: [background, text]. Missing numbers fall back to the US colours. */
  customColors: z.record(z.string().regex(/^\d+$/), z.tuple([hex, hex])).default({}),
});
export type Style = z.infer<typeof StyleSchema>;

export const RaceSchema = z
  .object({
    id: z.string().min(1).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ต้องเป็น YYYY-MM-DD"),
    course: z.string().default(""),
    round: z.string().default(""),
    postTime: z.string().default(""),
    name: z.string().min(1, "ต้องมีชื่อรายการ"),
    jpName: z.string().default(""),
    subtitle: z.string().default(""),
    grade: z.enum(GRADES).nullable().default(null),
    jump: z.boolean().default(false),
    class: z.enum(Object.keys(CLASSES) as [RaceClass, ...RaceClass[]]).nullable().default(null),
    surface: z.enum(SURFACES).default("Turf"),
    distanceM: z.number().int().positive().nullable().default(null),
    highlight: z.number().int().nullable().default(null),
    style: StyleSchema.default({}),
    runners: z.array(RunnerSchema).min(MIN_RUNNERS, `ม้าต้องมีอย่างน้อย ${MIN_RUNNERS} ตัว`).max(MAX_RUNNERS, `ม้าได้ไม่เกิน ${MAX_RUNNERS} ตัว`),
  })
  .superRefine((r, ctx) => {
    const seen = new Set<number>();
    for (const h of r.runners) {
      if (seen.has(h.number)) ctx.addIssue({ code: "custom", message: `เบอร์ ${h.number} ซ้ำ`, path: ["runners"] });
      seen.add(h.number);
    }
  });
export type RaceInput = z.input<typeof RaceSchema>;
export type Race = Omit<z.output<typeof RaceSchema>, "id"> & { id: string };

export const HomeSchema = z.object({
  title: z.string().default("Today's Races"),
  subtitle: z.string().default(""),
  highlight: z.string().nullable().default(null),
});
export type Home = z.infer<typeof HomeSchema>;

/** A whole export, or a file written by hand / by Claude: only `races` is required. */
export const FileSchema = z.object({
  version: z.literal(1).default(1),
  races: z.array(RaceSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
  home: HomeSchema.optional(),
  active: z.string().optional(),
  transition: z.enum(TRANSITIONS).optional(),
});
export type FileInput = z.input<typeof FileSchema>;

export interface AppData {
  version: 1;
  races: Race[];
  /** "home" (the race list page) or a race id. */
  active: string;
  transition: Transition;
  home: Home;
  /** Bumped when a picture changes in IndexedDB, so other pages reload it. Key: "race:<id>" or "home". */
  images: Record<string, number>;
}

export const HOME = "home";

export const newStyle = (): Style => StyleSchema.parse({});

let counter = 0;
export const newId = () => `r${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Same race = same date + course + round (case-insensitive); importing it again replaces it. */
export const raceKey = (r: Pick<Race, "date" | "course" | "round">) => `${r.date}|${r.course.trim().toLowerCase()}|${r.round.trim().toLowerCase()}`;

export type ParseResult = { ok: true; data: z.output<typeof FileSchema> } | { ok: false; error: string };

/** Validate a JSON text; errors are short Thai messages with the path, for the dock toast. */
export function parseFile(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "ไฟล์ไม่ใช่ JSON ที่ถูกต้อง" };
  }
  // A bare array of races is accepted too.
  if (Array.isArray(json)) json = { races: json };
  const res = FileSchema.safeParse(json);
  if (res.success) return { ok: true, data: res.data };
  const issue = res.error.issues[0];
  return { ok: false, error: `${issue.path.join(".") || "ไฟล์"}: ${issue.message}` };
}

/**
 * Merge imported races into the current data.
 * "append": add, replacing races with the same date+course+round (keeping their id, so Active stays).
 * "replace": the file becomes the whole list.
 */
export function mergeImport(cur: AppData, file: z.output<typeof FileSchema>, mode: "append" | "replace"): AppData {
  const incoming: Race[] = file.races.map((r) => ({ ...r, id: r.id ?? newId() }));
  if (mode === "replace") {
    const ids = new Set(incoming.map((r) => r.id));
    const active = file.active && (file.active === HOME || ids.has(file.active)) ? file.active : HOME;
    return {
      ...cur,
      races: incoming,
      active,
      transition: file.transition ?? cur.transition,
      home: file.home ?? cur.home,
    };
  }
  const races = [...cur.races];
  for (const r of incoming) {
    const i = races.findIndex((x) => raceKey(x) === raceKey(r) || x.id === r.id);
    if (i >= 0) races[i] = { ...r, id: races[i].id };
    else races.push(r);
  }
  return { ...cur, races };
}

export function exportFile(data: AppData, only?: string): FileInput {
  const races = only ? data.races.filter((r) => r.id === only) : data.races;
  return only
    ? { version: 1, races }
    : { version: 1, races, home: data.home, active: data.active, transition: data.transition };
}
