import { TZDate } from "@date-fns/tz";

/**
 * The clinic's IANA timezone.
 *
 * Argentina has had no DST since 2009, but this is deliberately *not* hardcoded
 * as UTC-3: if the country reinstates DST, an offset constant would silently
 * shift every turno by an hour, whereas an IANA zone just keeps working.
 */
export const CLINIC_TZ = "America/Argentina/Buenos_Aires";

const MINUTE_MS = 60_000;

/** A recurring working block, e.g. Monday 09:00-13:00. `weekday` is 0 = Sunday. */
export type ScheduleRow = {
  weekday: number;
  /** Clinic-local wall clock, "HH:MM" or "HH:MM:SS". */
  start_time: string;
  end_time: string;
};

/** A one-off closure: holiday, vacation, errand. Absolute instants. */
export type BlockRow = {
  starts_at: string | Date;
  ends_at: string | Date;
};

export type Slot = {
  start: Date;
  end: Date;
};

export type GenerateSlotsInput = {
  /** Inclusive lower bound of the window to generate. */
  from: Date;
  /** Exclusive upper bound of the window to generate. */
  to: Date;
  weeklySchedule: ScheduleRow[];
  blocks: BlockRow[];
  /** `starts_at` of every appointment that currently holds a slot. */
  taken: Array<string | Date>;
  slotMinutes: number;
  now: Date;
  /**
   * How many calendar days ahead may be booked, counting today as day 0.
   * `null` means unlimited — that is how Rosa books "te espero en un mes"
   * from the admin while the public form stays capped.
   */
  horizonDays?: number | null;
  /** Refuse slots starting sooner than this many minutes from `now`. */
  minLeadMinutes?: number;
};

/** Parse "HH:MM" / "HH:MM:SS" into hours and minutes. */
function parseTime(value: string): { hours: number; minutes: number } {
  const [rawHours, rawMinutes] = value.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes ?? 0);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    throw new Error(`Invalid time value: ${value}`);
  }

  return { hours, minutes };
}

/** A clinic-local calendar day, detached from any absolute instant. */
type LocalDay = { year: number; month: number; day: number };

function toLocalDay(instant: Date): LocalDay {
  const local = new TZDate(instant, CLINIC_TZ);
  return {
    year: local.getFullYear(),
    month: local.getMonth(),
    day: local.getDate(),
  };
}

/** Resolve a clinic-local wall clock on a given local day to an absolute instant. */
function atLocalTime(day: LocalDay, hours: number, minutes: number): Date {
  const local = new TZDate(day.year, day.month, day.day, hours, minutes, 0, CLINIC_TZ);
  return new Date(local.getTime());
}

/** Day of week (0 = Sunday) for a clinic-local day. */
function weekdayOf(day: LocalDay): number {
  return new TZDate(day.year, day.month, day.day, 12, 0, 0, CLINIC_TZ).getDay();
}

/** Shift a local day by whole calendar days. Date overflow normalises for us. */
function addLocalDays(day: LocalDay, amount: number): LocalDay {
  const shifted = new TZDate(day.year, day.month, day.day + amount, 12, 0, 0, CLINIC_TZ);
  return {
    year: shifted.getFullYear(),
    month: shifted.getMonth(),
    day: shifted.getDate(),
  };
}

/**
 * The last bookable instant under a horizon of `horizonDays`.
 *
 * Patients think in calendar days, not in 24-hour multiples, so a 15-day horizon
 * means "up to and including the end of the day 15 days from today" rather than
 * "360 hours from this exact moment".
 */
function horizonCutoff(now: Date, horizonDays: number): Date {
  const lastDay = addLocalDays(toLocalDay(now), horizonDays);
  // Midnight at the start of the following day == end of the last bookable day.
  return atLocalTime({ ...lastDay, day: lastDay.day + 1 }, 0, 0);
}

/**
 * Generate the bookable slots in a window.
 *
 * Availability is: the weekly schedule, cut into fixed-length slots, minus
 * blocks, minus slots already taken, minus anything in the past or beyond the
 * booking horizon.
 *
 * Deliberately pure — no database, no clock, no timezone ambient state. Every
 * input is passed in, which is what makes the edge cases cheap to test.
 */
export function generateSlots({
  from,
  to,
  weeklySchedule,
  blocks,
  taken,
  slotMinutes,
  now,
  horizonDays = null,
  minLeadMinutes = 0,
}: GenerateSlotsInput): Slot[] {
  if (slotMinutes <= 0) {
    throw new Error("slotMinutes must be positive");
  }

  const slotMs = slotMinutes * MINUTE_MS;
  const earliest = now.getTime() + minLeadMinutes * MINUTE_MS;
  const cutoff = horizonDays === null ? Infinity : horizonCutoff(now, horizonDays).getTime();

  const takenStarts = new Set(taken.map((value) => new Date(value).getTime()));
  const blockRanges = blocks.map((block) => ({
    start: new Date(block.starts_at).getTime(),
    end: new Date(block.ends_at).getTime(),
  }));

  // Index the schedule by weekday so each day is a lookup rather than a scan.
  const byWeekday = new Map<number, ScheduleRow[]>();
  for (const row of weeklySchedule) {
    const rows = byWeekday.get(row.weekday) ?? [];
    rows.push(row);
    byWeekday.set(row.weekday, rows);
  }

  const slots: Slot[] = [];
  const windowStart = from.getTime();
  const windowEnd = to.getTime();

  // Walk clinic-local calendar days. Starting one day early and ending one day
  // late costs nothing and guards against a shift that straddles the window edge
  // once converted from local time to an absolute instant.
  let day = addLocalDays(toLocalDay(from), -1);
  const lastDay = addLocalDays(toLocalDay(to), 1);
  const lastDayKey = lastDay.year * 10_000 + lastDay.month * 100 + lastDay.day;

  while (day.year * 10_000 + day.month * 100 + day.day <= lastDayKey) {
    for (const shift of byWeekday.get(weekdayOf(day)) ?? []) {
      const open = parseTime(shift.start_time);
      const close = parseTime(shift.end_time);
      const shiftStart = atLocalTime(day, open.hours, open.minutes).getTime();
      const shiftEnd = atLocalTime(day, close.hours, close.minutes).getTime();

      // Slots run back to back, with no gap between them. This is deliberate and
      // confirmed with Rosa: the appointment length already includes sterilising
      // the instruments and preparing the box, so a separate buffer would double
      // count it and shrink her day. Do not "fix" this by adding a gap without
      // asking her first.
      //
      // A slot must fit entirely inside the shift; no stub at the end of the day.
      for (let start = shiftStart; start + slotMs <= shiftEnd; start += slotMs) {
        const end = start + slotMs;

        if (start < windowStart || start >= windowEnd) continue;
        if (start < earliest) continue;
        if (start >= cutoff) continue;
        if (takenStarts.has(start)) continue;

        // Half-open overlap: touching at the boundary is not a clash.
        const blocked = blockRanges.some((range) => start < range.end && end > range.start);
        if (blocked) continue;

        slots.push({ start: new Date(start), end: new Date(end) });
      }
    }

    day = addLocalDays(day, 1);
  }

  slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  return slots;
}

/** Group slots by their clinic-local date ("2026-09-10"), preserving order. */
export function groupSlotsByLocalDate(slots: Slot[]): Map<string, Slot[]> {
  const grouped = new Map<string, Slot[]>();

  for (const slot of slots) {
    const { year, month, day } = toLocalDay(slot.start);
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(slot);
    grouped.set(key, bucket);
  }

  return grouped;
}

/**
 * The absolute bounds of a clinic-local calendar day, `offsetDays` from `from`.
 *
 * The reminder cron needs "tomorrow in Buenos Aires", which is not the same as
 * "now plus 24 hours": a job running at 23:00 local would otherwise reach into
 * the day after tomorrow and skip a whole day of turnos.
 */
export function localDayRange(from: Date, offsetDays = 0): { start: Date; end: Date } {
  const day = addLocalDays(toLocalDay(from), offsetDays);
  return {
    start: atLocalTime(day, 0, 0),
    end: atLocalTime({ ...day, day: day.day + 1 }, 0, 0),
  };
}

/**
 * Absolute bounds of a clinic-local day given as "YYYY-MM-DD".
 *
 * Used by the admin's date picker: a native `<input type="date">` yields a bare
 * calendar date with no zone, and `new Date("2026-09-10")` would parse it as UTC
 * midnight — which is 21:00 the previous day in Buenos Aires.
 */
export function localDayRangeFromKey(key: string): { start: Date; end: Date } {
  const [year, month, day] = key.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date key: ${key}`);
  }

  const local: LocalDay = { year, month: month - 1, day };
  return {
    start: atLocalTime(local, 0, 0),
    end: atLocalTime({ ...local, day: local.day + 1 }, 0, 0),
  };
}
