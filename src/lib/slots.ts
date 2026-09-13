import { TZDate } from "@date-fns/tz";

/**
 * The clinic's IANA timezone. The consultorio is in Salta.
 *
 * Two deliberate choices here, and neither is cosmetic today:
 *
 *  - A zone name, not a `-03:00` offset. Argentina has had no DST since 2009,
 *    but if it comes back an offset constant would silently shift every turno
 *    by an hour.
 *  - *Salta*, not Buenos Aires. The two agree right now, but they have not
 *    always: Salta opted out of the 2008-2009 DST period while Buenos Aires
 *    observed it, leaving them an hour apart. If that ever happens again, this
 *    is the line that keeps the turnos right.
 */
export const CLINIC_TZ = "America/Argentina/Salta";

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/** A recurring working block, e.g. Monday 09:00-13:00. `weekday` is 0 = Sunday. */
export type ScheduleRow = {
  weekday: number;
  /** Clinic-local wall clock, "HH:MM" or "HH:MM:SS". */
  start_time: string;
  end_time: string;
  /** En qué sede se atiende esa franja. El horario libre la hereda. */
  location_id: string;
};

/**
 * A stretch of time that is not available: a closure, or an existing turno.
 *
 * Both are treated identically — what matters is the range they occupy, not why.
 */
export type BusyRange = {
  starts_at: string | Date;
  ends_at: string | Date;
};

/**
 * A one-off closure: holiday, vacation, errand. Absolute instants.
 *
 * `location_id` en null cierra TODAS las sedes; con id, sólo esa. Los turnos ya
 * tomados no llevan sede a propósito: un profesional ocupado lo está en todos
 * lados, porque no puede estar en dos lugares a la vez.
 */
export type BlockRow = BusyRange & {
  location_id?: string | null;
};

export type Slot = {
  start: Date;
  end: Date;
  /** La sede de la franja de la que salió. */
  locationId: string;
};

export type GenerateSlotsInput = {
  /** Inclusive lower bound of the window to generate. */
  from: Date;
  /** Exclusive upper bound of the window to generate. */
  to: Date;
  weeklySchedule: ScheduleRow[];
  blocks: BlockRow[];
  /**
   * The time every active appointment occupies.
   *
   * Ranges, not start times: an appointment left over from a different slot
   * length (say 11:15-12:00 after the clinic moved to hourly turnos) sits off
   * the current grid, and matching on start time alone would happily offer
   * 11:00-12:00 right on top of it.
   */
  taken: BusyRange[];
  slotMinutes: number;
  now: Date;
  /**
   * How many calendar days ahead may be booked, counting today as day 0.
   * `null` means unlimited — that is how Rosa books "te espero en un mes"
   * from the admin while the public form stays capped.
   */
  horizonDays?: number | null;
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
}: GenerateSlotsInput): Slot[] {
  if (slotMinutes <= 0) {
    throw new Error("slotMinutes must be positive");
  }

  const slotMs = slotMinutes * MINUTE_MS;
  // Sólo se descartan los horarios que ya pasaron. No hay anticipación mínima:
  // Rosa está en el consultorio durante esas horas, así que un turno tomado diez
  // minutos antes es un turno lleno que si no quedaba vacío. Si alguna vez la
  // sorprende, el problema es que no le avisan, no que falte un margen.
  const earliest = now.getTime();
  const cutoff = horizonDays === null ? Infinity : horizonCutoff(now, horizonDays).getTime();

  // Closures and existing turnos are the same thing here: time that is spoken
  // for. Una sola prueba de solapamiento cubre las dos, con una diferencia: un
  // cierre puede ser de una sede sola, y un turno tomado ocupa al profesional
  // esté donde esté.
  const busy = [
    ...blocks.map((range) => ({
      start: new Date(range.starts_at).getTime(),
      end: new Date(range.ends_at).getTime(),
      locationId: range.location_id ?? null,
    })),
    ...taken.map((range) => ({
      start: new Date(range.starts_at).getTime(),
      end: new Date(range.ends_at).getTime(),
      locationId: null,
    })),
  ];

  const slots: Slot[] = [];
  const windowStart = from.getTime();
  const windowEnd = to.getTime();

  // Recorre los días del calendario en Salta, con un día de margen a cada lado.
  //
  // Hoy ese margen es seguro de más: el esquema exige end_time > start_time, así
  // que ninguna franja cruza la medianoche y el día anterior no puede aportar un
  // horario dentro de la ventana. Ningún test nota si se saca — se comprobó
  // mutando esta línea.
  //
  // Se mantiene porque deja de ser código muerto en cuanto alguien agregue una
  // franja nocturna, y una iteración de más no cuesta nada. Los días que sobran
  // los descarta el filtro de ventana igual.
  const firstDay = addLocalDays(toLocalDay(from), -1);
  const dayCount = Math.ceil((windowEnd - windowStart) / DAY_MS) + 3;

  for (let offset = 0; offset < dayCount; offset += 1) {
    const day = addLocalDays(firstDay, offset);
    const weekday = weekdayOf(day);

    for (const shift of weeklySchedule.filter((row) => row.weekday === weekday)) {
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

        // Half-open overlap: touching at the boundary is not a clash, so a turno
        // ending at 12:00 leaves 12:00 free. Un cierre con sede sólo choca con
        // los horarios de esa sede; en null choca con todos.
        //
        // Acá sí se comparan rangos. La base, desde 0008, sólo compara la hora
        // de inicio: este motor es más estricto que la restricción que lo
        // respalda, y por eso es el que evita ofrecer un horario que se pise
        // con un turno que quedó fuera de la grilla.
        const clash = busy.some(
          (range) =>
            start < range.end &&
            end > range.start &&
            (range.locationId === null || range.locationId === shift.location_id),
        );
        if (clash) continue;

        slots.push({
          start: new Date(start),
          end: new Date(end),
          locationId: shift.location_id,
        });
      }
    }
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
 * The admin needs "tomorrow in Salta", which is not the same as
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
 * midnight — which is 21:00 the previous day in Salta.
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
