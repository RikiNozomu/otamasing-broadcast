import { describe, expect, it } from "vitest";
import { activeExists, parseActive, resultOf, type Race } from "../../src/lib/model";
import { finishers, MAX_LOCKS, resultPage } from "../../src/lib/results";
import { sampleData } from "../../src/lib/sample";

const race = (): Race => structuredClone(sampleData().races.find((r) => r.id === "sample-11")!);
const nos = (rows: { number: number }[]) => rows.map((h) => h.number);
const pos = (r: Race, rows: { number: number }[]) => rows.map((h) => r.runners.find((x) => x.number === h.number)!.finish);

describe("result paging", () => {
  it("lists finishers in order, leaving out the scratched horse", () => {
    const r = race();
    expect(finishers(r)).toHaveLength(17);
    expect(finishers(r).some((h) => h.number === 6)).toBe(false);
    expect(pos(r, finishers(r))).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
  });
  it("shows 10 rows per page", () => {
    const r = race();
    const p1 = resultPage(r, 0), p2 = resultPage(r, 1);
    expect(p1.pageCount).toBe(2);
    expect(pos(r, p1.rows)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pos(r, p2.rows)).toEqual([11, 12, 13, 14, 15, 16, 17]);
  });
  it("keeps locked horses on top of every page; the rest fill the remaining rows", () => {
    const r = race();
    r.result.locked = [9, 3, 12]; // 1st, 2nd, 3rd
    expect(pos(r, resultPage(r, 0).rows)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pos(r, resultPage(r, 1).rows)).toEqual([1, 2, 3, 11, 12, 13, 14, 15, 16, 17]);
    expect(resultPage(r, 1).locked).toEqual(new Set([9, 3, 12]));
  });
  it("locks any horse, sorted by position, and makes more pages when fewer rows are left", () => {
    const r = race();
    r.result.locked = [17, 9]; // 17th and 1st
    const p = resultPage(r, 2);
    expect(p.pageCount).toBe(2);
    expect(nos(p.rows).slice(0, 2)).toEqual([9, 17]);
    expect(pos(r, p.rows)).toEqual([1, 17, 10, 11, 12, 13, 14, 15, 16]);
  });
  it("clamps the page, ignores locks on horses without a result, and caps the locks", () => {
    const r = race();
    r.result.locked = [6];
    expect(resultPage(r, 5).page).toBe(1);
    expect(resultPage(r).locked.size).toBe(0);
    r.result.locked = r.runners.map((h) => h.number);
    expect(resultPage(r).locked.size).toBe(MAX_LOCKS);
  });
});

describe("Active values", () => {
  it("parses home, blank, a racecard and a result page", () => {
    expect(parseActive("home")).toEqual({ view: "home" });
    expect(parseActive("blank")).toEqual({ view: "blank" });
    expect(parseActive("sample-11")).toEqual({ view: "card", raceId: "sample-11" });
    expect(parseActive(resultOf("sample-11"))).toEqual({ view: "result", raceId: "sample-11" });
  });
  it("is valid only for an existing race", () => {
    const races = [{ id: "a" }];
    expect(activeExists("blank", races)).toBe(true);
    expect(activeExists(resultOf("a"), races)).toBe(true);
    expect(activeExists(resultOf("b"), races)).toBe(false);
  });
});
