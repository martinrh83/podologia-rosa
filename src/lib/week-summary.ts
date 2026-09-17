import { WEEKDAYS } from "@/lib/weekdays";

type ScheduleShift = { weekday: number; start_time: string; end_time: string };

export type WeekSummary = {
  /** "Lunes a sábado", "Lunes, miércoles y viernes". */
  days: string;
  /**
   * "de 9 a 18 h", sólo si TODOS los días atienden en las mismas franjas. Con
   * horarios distintos por día, una frase no alcanza para decirlo sin mentir:
   * queda en null y el detalle vive en "Cómo llegar", con `groupWeekByHours`.
   */
  hours: string | null;
};

/**
 * La semana del consultorio en una línea, para el hero.
 *
 * Sale de `weekly_schedule`, igual que los horarios de "Cómo llegar": las dos
 * muestran el mismo dato y no pueden contradecirse.
 *
 * Null si no hay agenda cargada: mejor no decir nada que decir "cerrado".
 */
export function summarizeWeek(schedule: ScheduleShift[]): WeekSummary | null {
  const signatures = signaturesByDay(schedule);
  if (signatures.size === 0) return null;

  const distinct = new Set(signatures.values());

  return {
    days: describeDays([...signatures.keys()]),
    hours: distinct.size === 1 ? describeShifts([...distinct][0].split(",")) : null,
  };
}

/**
 * La semana de una sede, agrupada por horario, para su tarjeta en "Cómo llegar":
 *
 *   Lunes y miércoles          de 8 a 12 y de 16 a 20 h
 *   Martes, jueves y viernes   de 16 a 20 h
 *
 * Es lo que `summarizeWeek` no puede decir en una línea cuando los horarios
 * cambian según el día. Los grupos van en el orden de la semana de Rosa, por su
 * primer día. Lista vacía sin agenda cargada.
 */
export function groupWeekByHours(schedule: ScheduleShift[]): { days: string; hours: string }[] {
  const daysBySignature = new Map<string, number[]>();
  for (const [day, signature] of signaturesByDay(schedule)) {
    const days = daysBySignature.get(signature) ?? [];
    days.push(day);
    daysBySignature.set(signature, days);
  }

  return [...daysBySignature].map(([signature, days]) => ({
    days: describeDays(days),
    hours: describeShifts(signature.split(",")),
  }));
}

/**
 * Las franjas de cada día como texto comparable ("08:00-12:00,16:00-20:00"),
 * con los días en el orden de Rosa, que arranca el lunes: así "sábado y
 * domingo" es una corrida seguida y no dos puntas de la semana. Las franjas se
 * deduplican porque dos profesionales en el mismo horario son UNA franja del
 * consultorio.
 */
function signaturesByDay(schedule: ScheduleShift[]): Map<number, string> {
  const shiftsByDay = new Map<number, Set<string>>();
  for (const row of schedule) {
    const shifts = shiftsByDay.get(row.weekday) ?? new Set<string>();
    shifts.add(`${row.start_time.slice(0, 5)}-${row.end_time.slice(0, 5)}`);
    shiftsByDay.set(row.weekday, shifts);
  }

  return new Map(
    WEEKDAYS.filter((day) => shiftsByDay.has(day.value)).map((day) => [
      day.value,
      [...shiftsByDay.get(day.value)!].sort().join(","),
    ]),
  );
}

/** Agrupa días seguidos: [1,2,3,5] → "Lunes a miércoles y viernes". */
function describeDays(days: number[]): string {
  const order = WEEKDAYS.map((day) => day.value as number);
  const label = (value: number) => WEEKDAYS.find((day) => day.value === value)!.label.toLowerCase();

  const runs: number[][] = [];
  for (const day of days) {
    const run = runs.at(-1);
    if (run && order.indexOf(day) === order.indexOf(run.at(-1)!) + 1) run.push(day);
    else runs.push([day]);
  }

  const parts = runs.flatMap((run) =>
    // Dos días seguidos se nombran los dos: "lunes a martes" suena raro.
    run.length > 2 ? [`${label(run[0])} a ${label(run.at(-1)!)}`] : run.map(label),
  );
  const text = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}` : parts[0];
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** ["08:00-12:00", "16:00-20:00"] → "de 8 a 12 y de 16 a 20 h". */
function describeShifts(shifts: string[]): string {
  const hour = (hhmm: string) => {
    const [h, m] = hhmm.split(":");
    return m === "00" ? String(Number(h)) : `${Number(h)}:${m}`;
  };
  const parts = shifts.map((shift) => {
    const [start, end] = shift.split("-");
    return `de ${hour(start)} a ${hour(end)}`;
  });
  return `${parts.join(" y ")} h`;
}
