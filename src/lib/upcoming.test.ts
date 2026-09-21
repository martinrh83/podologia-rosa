import { describe, expect, it } from "vitest";

import { groupByLocalDay, sanitizeSearch, searchPattern } from "./upcoming";

describe("groupByLocalDay", () => {
  it("groups consecutive turnos under their local day, in order", () => {
    const groups = groupByLocalDay([
      { id: "a", starts_at: "2026-09-21T12:00:00.000Z" },
      { id: "b", starts_at: "2026-09-21T15:30:00.000Z" },
      { id: "c", starts_at: "2026-09-23T13:00:00.000Z" },
    ]);

    expect(groups.map((group) => group.dayKey)).toEqual(["2026-09-21", "2026-09-23"]);
    expect(groups[0].appointments.map((row) => row.id)).toEqual(["a", "b"]);
    expect(groups[1].appointments.map((row) => row.id)).toEqual(["c"]);
  });

  it("keeps a late turno on its Salta day, not the next UTC day", () => {
    // 2026-09-22T00:30Z is 21:30 on the 21st in Salta.
    const groups = groupByLocalDay([
      { id: "a", starts_at: "2026-09-21T20:00:00.000Z" },
      { id: "b", starts_at: "2026-09-22T00:30:00.000Z" },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].dayKey).toBe("2026-09-21");
  });

  it("returns nothing for no turnos", () => {
    expect(groupByLocalDay([])).toEqual([]);
  });
});

describe("sanitizeSearch", () => {
  it("trims and collapses spaces", () => {
    expect(sanitizeSearch("  maría   gómez ")).toBe("maría gómez");
  });

  it("drops what would break or widen the PostgREST filter", () => {
    expect(sanitizeSearch('perez,status.eq."x"')).toBe("perez status eq x");
    expect(sanitizeSearch(".*")).toBeNull();
    expect(sanitizeSearch("[a-z]+")).toBe("a-z");
    expect(sanitizeSearch("(ana)")).toBe("ana");
    expect(sanitizeSearch("%")).toBeNull();
    expect(sanitizeSearch("ro_sa*")).toBe("ro sa");
  });

  it("treats empty or missing input as no search", () => {
    expect(sanitizeSearch("")).toBeNull();
    expect(sanitizeSearch("   ")).toBeNull();
    expect(sanitizeSearch(undefined)).toBeNull();
    expect(sanitizeSearch(["a", "b"])).toBeNull();
  });
});

describe("searchPattern", () => {
  const matches = (word: string, name: string) =>
    new RegExp(`^${searchPattern(word)}$`, "i").test(name);

  it("finds accented names typed without accents, and the other way round", () => {
    expect(matches("maria", "María")).toBe(true);
    expect(matches("maría", "Maria")).toBe(true);
    expect(matches("alvarez", "Álvarez")).toBe(true);
    expect(matches("munoz", "Muñoz")).toBe(true);
    expect(matches("GOMEZ", "Gómez")).toBe(true);
  });

  it("does not widen past the letters typed", () => {
    expect(matches("maria", "Mario")).toBe(false);
    expect(searchPattern("3874")).toBe("3874");
  });
});
