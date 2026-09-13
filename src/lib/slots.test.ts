import { describe, expect, it } from "vitest";

import {
  generateSlots,
  groupSlotsByLocalDate,
  localDayRange,
  localDayRangeFromKey,
  type ScheduleRow,
} from "./slots";

// 2026-09-10 is a Thursday (weekday 4). Salta is UTC-3, so 09:00 local is
// 12:00Z — the tests assert that mapping explicitly rather than trusting it.
const THURSDAY = 4;

/** Las dos sedes. Ids cualquiera: al motor sólo le importa que sean distintos. */
const CENTRO = "centro";
const NORTE = "norte";

/** Split shift: mornings 09:00-13:00, afternoons 16:00-20:00. */
const SPLIT_SHIFT: ScheduleRow[] = [
  { weekday: THURSDAY, start_time: "09:00", end_time: "13:00", location_id: CENTRO },
  { weekday: THURSDAY, start_time: "16:00", end_time: "20:00", location_id: CENTRO },
];

const WINDOW = {
  // The whole of Thursday 2026-09-10 in clinic-local time.
  from: new Date("2026-09-10T03:00:00.000Z"),
  to: new Date("2026-09-11T03:00:00.000Z"),
};

/** A moment well before the window, so nothing is filtered as "past". */
const NOW = new Date("2026-09-09T12:00:00.000Z");

function run(overrides: Partial<Parameters<typeof generateSlots>[0]> = {}) {
  return generateSlots({
    ...WINDOW,
    weeklySchedule: SPLIT_SHIFT,
    blocks: [],
    taken: [],
    slotMinutes: 45,
    now: NOW,
    horizonDays: 15,
    ...overrides,
  });
}

const iso = (slots: ReturnType<typeof generateSlots>) =>
  slots.map((slot) => slot.start.toISOString());

describe("generateSlots", () => {
  it("maps clinic-local wall clock onto the correct absolute instant", () => {
    const slots = run();
    // 09:00 in Salta is 12:00 UTC.
    expect(slots[0].start.toISOString()).toBe("2026-09-10T12:00:00.000Z");
    expect(slots[0].end.toISOString()).toBe("2026-09-10T12:45:00.000Z");
  });

  it("covers both halves of a split shift", () => {
    const starts = iso(run());

    expect(starts).toEqual([
      "2026-09-10T12:00:00.000Z", // 09:00
      "2026-09-10T12:45:00.000Z", // 09:45
      "2026-09-10T13:30:00.000Z", // 10:30
      "2026-09-10T14:15:00.000Z", // 11:15
      "2026-09-10T15:00:00.000Z", // 12:00
      "2026-09-10T19:00:00.000Z", // 16:00
      "2026-09-10T19:45:00.000Z", // 16:45
      "2026-09-10T20:30:00.000Z", // 17:30
      "2026-09-10T21:15:00.000Z", // 18:15
      "2026-09-10T22:00:00.000Z", // 19:00
    ]);
  });

  it("never emits a slot that would run past the end of a shift", () => {
    // 09:00-13:00 is 240 min; at 45 min each, the 6th slot would end at 13:30.
    const morning = run().filter((slot) => slot.start < new Date("2026-09-10T16:00:00.000Z"));

    expect(morning).toHaveLength(5);
    expect(morning.at(-1)!.end.toISOString()).toBe("2026-09-10T15:45:00.000Z"); // 12:45 local
  });

  it("removes only the slots a mid-shift block actually overlaps", () => {
    // Block 10:15-11:00 local (13:15-14:00Z). It overlaps the 10:30 slot, and
    // also the 09:45 slot which runs until 10:30.
    const slots = iso(
      run({
        blocks: [
          {
            starts_at: "2026-09-10T13:15:00.000Z",
            ends_at: "2026-09-10T14:00:00.000Z",
          },
        ],
      }),
    );

    expect(slots).not.toContain("2026-09-10T12:45:00.000Z"); // 09:45, overlaps
    expect(slots).not.toContain("2026-09-10T13:30:00.000Z"); // 10:30, overlaps
    expect(slots).toContain("2026-09-10T12:00:00.000Z"); // 09:00, ends before
    expect(slots).toContain("2026-09-10T14:15:00.000Z"); // 11:15, starts after
  });

  it("treats a block that merely touches a slot boundary as no clash", () => {
    // Block runs exactly up to the 09:45 slot's start.
    const slots = iso(
      run({
        blocks: [
          {
            starts_at: "2026-09-10T12:00:00.000Z",
            ends_at: "2026-09-10T12:45:00.000Z",
          },
        ],
      }),
    );

    expect(slots).not.toContain("2026-09-10T12:00:00.000Z"); // the blocked one
    expect(slots).toContain("2026-09-10T12:45:00.000Z"); // abuts, still free
  });

  it("returns nothing for a day blocked end to end", () => {
    const slots = run({
      blocks: [
        {
          starts_at: "2026-09-10T03:00:00.000Z",
          ends_at: "2026-09-11T03:00:00.000Z",
        },
      ],
    });

    expect(slots).toEqual([]);
  });

  it("excludes slots already taken", () => {
    const slots = iso(
      run({
        taken: [
          { starts_at: "2026-09-10T12:00:00.000Z", ends_at: "2026-09-10T12:45:00.000Z" },
          { starts_at: "2026-09-10T19:00:00.000Z", ends_at: "2026-09-10T19:45:00.000Z" },
        ],
      }),
    );

    expect(slots).not.toContain("2026-09-10T12:00:00.000Z");
    expect(slots).not.toContain("2026-09-10T19:00:00.000Z");
    expect(slots).toHaveLength(8);
  });

  it("returns nothing when every slot of the day is booked", () => {
    const everything = run().map((slot) => ({ starts_at: slot.start, ends_at: slot.end }));

    expect(run({ taken: everything })).toEqual([]);
  });

  it("hides a slot that OVERLAPS an existing turno, not just one that matches it", () => {
    // The bug this replaced: an 11:15-12:00 turno left over from when turnos were
    // 45 minutes long sits off the current hourly grid. Matching on start time
    // alone left 11:00-12:00 on offer, right on top of it.
    // 10:45-11:30 local: starts and ends mid-slot, so it lands on no grid line
    // and its start time matches no slot at all.
    const offGrid = [
      { starts_at: "2026-09-10T13:45:00.000Z", ends_at: "2026-09-10T14:30:00.000Z" },
    ];

    const slots = iso(run({ taken: offGrid }));

    // Both slots it cuts into must disappear, even though neither starts at
    // 13:45 — the old start-time match kept both on offer.
    expect(slots).not.toContain("2026-09-10T13:30:00.000Z"); // 10:30-11:15
    expect(slots).not.toContain("2026-09-10T14:15:00.000Z"); // 11:15-12:00
    // Untouched on either side.
    expect(slots).toContain("2026-09-10T12:45:00.000Z"); // ends 13:30, before it
    expect(slots).toContain("2026-09-10T15:00:00.000Z"); // starts 15:00, after it
  });

  it("frees a slot that merely abuts a turno", () => {
    const before = [
      { starts_at: "2026-09-10T11:15:00.000Z", ends_at: "2026-09-10T12:00:00.000Z" },
    ];

    // The turno ends exactly at the 09:00 slot's start: no clash.
    expect(iso(run({ taken: before }))).toContain("2026-09-10T12:00:00.000Z");
  });

  it("returns nothing for a weekday with no scheduled shift", () => {
    // Friday 2026-09-11; the schedule only covers Thursday.
    const slots = run({
      from: new Date("2026-09-11T03:00:00.000Z"),
      to: new Date("2026-09-12T03:00:00.000Z"),
    });

    expect(slots).toEqual([]);
  });

  it("drops slots in the past but keeps later ones the same day", () => {
    const slots = iso(
      run({
        // 11:00 local on the day itself.
        now: new Date("2026-09-10T14:00:00.000Z"),
      }),
    );

    expect(slots).not.toContain("2026-09-10T12:00:00.000Z"); // 09:00, gone
    expect(slots).not.toContain("2026-09-10T13:30:00.000Z"); // 10:30, gone
    expect(slots).toContain("2026-09-10T14:15:00.000Z"); // 11:15, still bookable
  });

});

describe("booking horizon", () => {
  const everyDay: ScheduleRow[] = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    start_time: "09:00",
    end_time: "10:30",
    location_id: CENTRO,
  }));

  // 2026-09-01T12:00Z is 09:00 local on Tuesday the 1st.
  const now = new Date("2026-09-01T12:00:00.000Z");

  function horizonRun(horizonDays: number | null) {
    return generateSlots({
      from: new Date("2026-09-01T03:00:00.000Z"),
      to: new Date("2026-10-15T03:00:00.000Z"),
      weeklySchedule: everyDay,
      blocks: [],
      taken: [],
      slotMinutes: 45,
      now,
      horizonDays,
    });
  }

  it("includes the whole of the last day inside the horizon", () => {
    const dates = [...groupSlotsByLocalDate(horizonRun(15)).keys()];

    // Today counts as day 0, so a 15-day horizon reaches 2026-09-16 inclusive.
    expect(dates.at(0)).toBe("2026-09-01");
    expect(dates.at(-1)).toBe("2026-09-16");
  });

  it("excludes the first day beyond the horizon", () => {
    const dates = [...groupSlotsByLocalDate(horizonRun(15)).keys()];

    expect(dates).not.toContain("2026-09-17");
  });

  it("excludes a slot starting exactly on the cutoff instant", () => {
    // A midnight shift puts a slot start exactly on the horizon boundary, which
    // is the only way to tell an inclusive cutoff from an exclusive one.
    const midnightShift: ScheduleRow[] = Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      start_time: "00:00",
      end_time: "01:00",
      location_id: CENTRO,
    }));

    const dates = [
      ...groupSlotsByLocalDate(
        generateSlots({
          from: new Date("2026-09-01T03:00:00.000Z"),
          to: new Date("2026-10-15T03:00:00.000Z"),
          weeklySchedule: midnightShift,
          blocks: [],
          taken: [],
          slotMinutes: 45,
          now,
          horizonDays: 15,
        }),
      ).keys(),
    ];

    // Midnight on the 16th is the last bookable instant; midnight on the 17th
    // is the cutoff itself and must fall outside.
    expect(dates).toContain("2026-09-16");
    expect(dates).not.toContain("2026-09-17");
  });

  it("treats a null horizon as unlimited, which is how the admin books", () => {
    const dates = [...groupSlotsByLocalDate(horizonRun(null)).keys()];

    // Well past the 15-day public cap: "te espero en un mes" has to work.
    expect(dates).toContain("2026-10-08");
  });
});

describe("groupSlotsByLocalDate", () => {
  it("buckets by clinic-local date, not by UTC date", () => {
    // 22:00Z on the 10th is 19:00 local on the 10th — same calendar day here,
    // but the grouping must come from the local date, not the UTC one.
    const grouped = groupSlotsByLocalDate(run());

    expect([...grouped.keys()]).toEqual(["2026-09-10"]);
    expect(grouped.get("2026-09-10")).toHaveLength(10);
  });
});

describe("localDayRange", () => {
  it("returns the local midnight boundaries, not a 24-hour offset from now", () => {
    // 23:00 local on the 10th. Naively adding 24h would land on the 11th at
    // 23:00 and cover the wrong day.
    const lateEvening = new Date("2026-09-11T02:00:00.000Z");
    const tomorrow = localDayRange(lateEvening, 1);

    // 2026-09-11 00:00 ART is 03:00Z.
    expect(tomorrow.start.toISOString()).toBe("2026-09-11T03:00:00.000Z");
    expect(tomorrow.end.toISOString()).toBe("2026-09-12T03:00:00.000Z");
  });

  it("handles today with no offset", () => {
    const today = localDayRange(new Date("2026-09-10T15:00:00.000Z"));

    expect(today.start.toISOString()).toBe("2026-09-10T03:00:00.000Z");
    expect(today.end.toISOString()).toBe("2026-09-11T03:00:00.000Z");
  });

  it("rolls across a month boundary", () => {
    const range = localDayRange(new Date("2026-09-30T15:00:00.000Z"), 1);

    expect(range.start.toISOString()).toBe("2026-10-01T03:00:00.000Z");
  });
});

describe("localDayRangeFromKey", () => {
  it("interprets a bare date in clinic time, not as UTC midnight", () => {
    // The trap: new Date("2026-09-10") is 00:00Z, which is 21:00 on the 9th in
    // Salta. The admin date picker would silently offer the wrong day.
    const range = localDayRangeFromKey("2026-09-10");

    expect(range.start.toISOString()).toBe("2026-09-10T03:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-09-11T03:00:00.000Z");
    expect(new Date("2026-09-10").toISOString()).not.toBe(range.start.toISOString());
  });

  it("rejects a malformed key rather than producing an Invalid Date", () => {
    expect(() => localDayRangeFromKey("no-es-fecha")).toThrow();
  });
});

describe("sedes", () => {
  /** Mismo día, mañana en una sede y tarde en la otra. */
  const DOS_SEDES: ScheduleRow[] = [
    { weekday: THURSDAY, start_time: "09:00", end_time: "13:00", location_id: CENTRO },
    { weekday: THURSDAY, start_time: "16:00", end_time: "20:00", location_id: NORTE },
  ];

  it("cada horario sale con la sede de su franja", () => {
    const slots = run({ weeklySchedule: DOS_SEDES });

    const manana = slots.filter((slot) => slot.start.toISOString() < "2026-09-10T18:00");
    const tarde = slots.filter((slot) => slot.start.toISOString() >= "2026-09-10T18:00");

    expect(manana.length).toBeGreaterThan(0);
    expect(tarde.length).toBeGreaterThan(0);
    expect(new Set(manana.map((slot) => slot.locationId))).toEqual(new Set([CENTRO]));
    expect(new Set(tarde.map((slot) => slot.locationId))).toEqual(new Set([NORTE]));
  });

  it("un cierre de una sede no toca a la otra", () => {
    // Todo el jueves cerrado, pero sólo en Centro.
    const slots = run({
      weeklySchedule: DOS_SEDES,
      blocks: [
        {
          starts_at: "2026-09-10T03:00:00.000Z",
          ends_at: "2026-09-11T03:00:00.000Z",
          location_id: CENTRO,
        },
      ],
    });

    expect(slots.every((slot) => slot.locationId === NORTE)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
  });

  it("un cierre sin sede cierra las dos", () => {
    const slots = run({
      weeklySchedule: DOS_SEDES,
      blocks: [
        { starts_at: "2026-09-10T03:00:00.000Z", ends_at: "2026-09-11T03:00:00.000Z" },
      ],
    });

    expect(slots).toEqual([]);
  });

  it("un turno ya tomado ocupa al profesional en las dos sedes", () => {
    // Nadie está en dos lugares a la vez: un turno de la mañana en Centro tiene
    // que bloquear también cualquier horario de la tarde que se pise, aunque
    // ese sea en la otra sede.
    const solapado = run({
      weeklySchedule: [
        { weekday: THURSDAY, start_time: "09:00", end_time: "10:00", location_id: CENTRO },
        { weekday: THURSDAY, start_time: "09:00", end_time: "10:00", location_id: NORTE },
      ],
      slotMinutes: 60,
      taken: [{ starts_at: "2026-09-10T12:00:00.000Z", ends_at: "2026-09-10T13:00:00.000Z" }],
    });

    expect(solapado).toEqual([]);
  });
});
