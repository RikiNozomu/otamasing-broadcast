import { describe, expect, it } from "vitest";
import { activeExists, parseActive, resultOf, type Race } from "../../src/lib/model";
import { finishers, MAX_LOCKS, resultEntries, resultMark, resultPage } from "../../src/lib/results";
import { sampleData } from "../../src/lib/sample";

const race = (): Race => structuredClone(sampleData().races.find((r) => r.id === "sample-11")!);
const nos = (rows: { number: number }[]) => rows.map((h) => h.number);
/** What the POS cell shows for each row: the position, or DNF / DQ / SCR. */
const pos = (r: Race, rows: { number: number }[]) => rows.map((h) => { const x = r.runners.find((y) => y.number === h.number)!; return resultMark(x) ?? x.finish; });

describe("result paging", () => {
  // sample 11R: 16 finishers, horse 17 DNF, horse 6 scratched
  it("lists finishers in order, then DNF, DQ and SCR", () => {
    const r = race();
    expect(finishers(r)).toHaveLength(16);
    expect(pos(r, resultEntries(r))).toEqual([...Array.from({ length: 16 }, (_, i) => i + 1), "DNF", "SCR"]);
    r.runners[1].outcome = "dq"; // horse 2 (10th) disqualified
    r.runners[0].finish = null; // horse 1 has no result yet: left out
    expect(pos(r, resultEntries(r)).slice(-4)).toEqual([16, "DNF", "DQ", "SCR"]);
    expect(resultEntries(r).some((h) => h.number === 1)).toBe(false);
  });
  it("a mark wins over a position", () => {
    expect(resultMark({ scratched: true, outcome: "dq" })).toBe("SCR");
    expect(resultMark({ scratched: false, outcome: "dnf" })).toBe("DNF");
    expect(resultMark({ scratched: false, outcome: null })).toBeNull();
  });
  it("shows 10 rows per page", () => {
    const r = race();
    const p1 = resultPage(r, 0), p2 = resultPage(r, 1);
    expect(p1.pageCount).toBe(2);
    expect(pos(r, p1.rows)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pos(r, p2.rows)).toEqual([11, 12, 13, 14, 15, 16, "DNF", "SCR"]);
  });
  it("keeps locked horses on top of every page; the rest fill the remaining rows", () => {
    const r = race();
    r.result.locked = [9, 3, 12]; // 1st, 2nd, 3rd
    expect(pos(r, resultPage(r, 0).rows)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pos(r, resultPage(r, 1).rows)).toEqual([1, 2, 3, 11, 12, 13, 14, 15, 16, "DNF"]);
    expect(pos(r, resultPage(r, 2).rows)).toEqual([1, 2, 3, "SCR"]);
    expect(resultPage(r, 1).locked).toEqual(new Set([9, 3, 12]));
  });
  it("locks any horse, sorted by position, and makes more pages when fewer rows are left", () => {
    const r = race();
    r.result.locked = [17, 9]; // DNF and 1st
    const p = resultPage(r, 5);
    expect(p.page).toBe(1);
    expect(p.pageCount).toBe(2);
    expect(nos(p.rows).slice(0, 2)).toEqual([9, 17]);
    expect(pos(r, p.rows)).toEqual([1, "DNF", 10, 11, 12, 13, 14, 15, 16, "SCR"]);
  });
  it("ignores locks on horses without a result, and caps the locks", () => {
    const r = race();
    r.runners[0].finish = null;
    r.result.locked = [1];
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
