import { WEEKDAYS } from "@/lib/weekdays";

type ScheduleShift = { weekday: number; start_time: string; end_time: string };

export type WeekSummary = {
  /** "Lunes a sábado", "Lunes, miércoles y viernes". */
  days: string;
  /**
   * "de 9 a 18 h", sólo si TODOS los días atienden en las mismas franjas. Con
   * horarios distintos por día, una frase no alcanza para decirlo sin mentir:
   * queda en null y la tabla completa vive en "Cómo llegar".
   */
  hours: string | null;
};

/**
 * La semana del consultorio en una línea, para el hero.
 *
 * Sale de `weekly_schedule`, igual que la tabla de "Cómo llegar": las dos
 * muestran el mismo dato y no pueden contradecirse. Las franjas se deduplican
 * porque dos profesionales en el mismo horario son UNA franja del consultorio.
 *
 * Null si no hay agenda cargada: mejor no decir nada que decir "cerrado".
 */
export function summarizeWeek(schedule: ScheduleShift[]): WeekSummary | null {
  const shiftsByDay = new Map<number, Set<string>>();
  for (const row of schedule) {
    const shifts = shiftsByDay.get(row.weekday) ?? new Set<string>();
    shifts.add(`${row.start_time.slice(0, 5)}-${row.end_time.slice(0, 5)}`);
    shiftsByDay.set(row.weekday, shifts);
  }

  // En el orden de Rosa, que arranca el lunes: así "sábado y domingo" es una
  // corrida seguida y no dos puntas de la semana.
  const open = WEEKDAYS.filter((day) => shiftsByDay.has(day.value));
  if (open.length === 0) return null;

  const signatures = open.map((day) => [...shiftsByDay.get(day.value)!].sort().join(","));
  const sameEveryDay = signatures.every((signature) => signature === signatures[0]);

  return {
    days: describeDays(open.map((day) => day.value)),
    hours: sameEveryDay ? describeShifts(signatures[0].split(",")) : null,
  };
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
