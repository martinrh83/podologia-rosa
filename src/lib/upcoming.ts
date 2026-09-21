import { toLocalDateKey } from "@/lib/format";

/**
 * Los turnos de la pantalla Próximos, partidos por día local.
 *
 * Por día de Salta y no de UTC: un turno de las 21 h ya es "mañana" en UTC, y
 * agrupar ingenuamente lo mandaría bajo el encabezado equivocado. Respeta el
 * orden de entrada, que ya viene por hora desde la base.
 */
export function groupByLocalDay<T extends { starts_at: string }>(
  appointments: T[],
): { dayKey: string; appointments: T[] }[] {
  const groups: { dayKey: string; appointments: T[] }[] = [];

  for (const appointment of appointments) {
    const dayKey = toLocalDateKey(appointment.starts_at);
    const last = groups.at(-1);
    if (last?.dayKey === dayKey) {
      last.appointments.push(appointment);
    } else {
      groups.push({ dayKey, appointments: [appointment] });
    }
  }

  return groups;
}

/**
 * Lo que se escribió en la búsqueda, listo para `searchPattern` dentro de `.or()`.
 *
 * Saca lo que rompería el filtro de PostgREST —la coma separa condiciones, los
 * paréntesis las agrupan, las comillas cierran el valor— y todo lo que una
 * expresión regular leería como comodín, para que «.*» no traiga todo. Una
 * búsqueda vacía es null: sin filtro.
 */
export function sanitizeSearch(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const clean = value
    .replace(/[%_,()*\\".^$[\]{}+?|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);

  return clean || null;
}

// Con las mayúsculas acentuadas a mano: `imatch` pliega A/a, pero según la
// intercalación de la base puede no plegar Á/á, y «Álvarez» empieza así.
const ACCENTS: Record<string, string> = {
  a: "aáÁ",
  e: "eéÉ",
  i: "iíïÍÏ",
  o: "oóÓ",
  u: "uúüÚÜ",
  n: "nñÑ",
};

/**
 * Una palabra de la búsqueda como expresión regular que no distingue tildes.
 *
 * «maria» tiene que encontrar a «María»: casi nadie escribe las tildes en el
 * teléfono, y casi todos los nombres las llevan. Cada vocal (y la ñ) se abre en
 * sus variantes —`mar[aáÁ][iíïÍÏ][aáÁ]`— y va a `imatch`, que además ignora
 * mayúsculas. Así no hace falta `unaccent` en la base.
 */
export function searchPattern(word: string): string {
  return [...word.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")]
    .map((char) => (ACCENTS[char] ? `[${ACCENTS[char]}]` : char))
    .join("");
}
