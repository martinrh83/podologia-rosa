/**
 * Los días de la semana, en el orden en que los piensa Rosa: arranca el lunes.
 *
 * El número es el de `Date.getDay()` —0 es domingo— porque es el que guarda
 * `weekly_schedule.weekday` y con el que trabaja el motor de horarios. Lo único
 * que cambia es el orden en que se muestran.
 */
export const WEEKDAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
] as const;

export function weekdayLabel(value: number): string {
  return WEEKDAYS.find((day) => day.value === value)?.label ?? "";
}
