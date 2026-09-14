import { z } from "zod";

/**
 * Booking input validation. Deliberately *outside* the `server-only` boundary:
 * the same schema validates on the client for instant feedback and on the server
 * as the actual gate, and keeping it importable also makes it unit-testable.
 */

/**
 * Reduce an Argentine phone number to its canonical 10-digit national form:
 * area code + subscriber number, e.g. "1155554444".
 *
 * Patients type the same number many ways — "11 5555-4444",
 * "(011) 15 5555 4444", "+54 9 11 5555 4444" — and all of them must collapse to
 * one value. This is load-bearing, not cosmetic: the per-contact cap counts by
 * phone, so any format that normalises differently is a way to bypass the limit.
 *
 * The Argentine rules applied here:
 *  - `54` is the country code.
 *  - A `9` after the country code marks a mobile line.
 *  - A leading `0` is the long-distance trunk prefix.
 *  - `15` sits between the area code and the subscriber number when dialling a
 *    mobile locally. Area codes are 2, 3 or 4 digits, so the `15` is located by
 *    trying each width and taking the one that yields 10 digits.
 *
 * Anything that does not look like an AR number is returned as bare digits, so
 * foreign numbers still normalise consistently even if not canonically.
 */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("54")) digits = digits.slice(2);
  if (digits.startsWith("9") && digits.length > 10) digits = digits.slice(1);
  if (digits.startsWith("0")) digits = digits.slice(1);

  // A local mobile format still carries the "15" between area and subscriber.
  if (digits.length === 12) {
    for (const areaLength of [2, 3, 4]) {
      if (digits.slice(areaLength, areaLength + 2) === "15") {
        const candidate = digits.slice(0, areaLength) + digits.slice(areaLength + 2);
        if (candidate.length === 10) return candidate;
      }
    }
  }

  return digits;
}

/**
 * Las tres coberturas que acepta el consultorio. `particular` es sin obra social.
 */
export const COVERAGES = [
  { value: "ips", label: "IPS" },
  { value: "osunsa", label: "OSUNSa" },
  { value: "particular", label: "Particular" },
] as const;

export type Coverage = (typeof COVERAGES)[number]["value"];

/**
 * Los valores solos, que son los que valida el schema.
 *
 * Derivados de `COVERAGES` y no escritos de nuevo: la lista se muestra en tres
 * pantallas y se valida acá, y cuando estaban tipeadas por separado agregar una
 * obra social eran dos ediciones. Olvidarse de ésta dejaba al formulario
 * ofreciendo una opción que el servidor rechazaba — un error que sólo aparece
 * cuando un paciente la elige.
 */
const COVERAGE_VALUES = COVERAGES.map((coverage) => coverage.value);

/**
 * DNI a dígitos: "20.123.456" y "20123456" son la misma persona.
 *
 * Se guarda normalizado para que buscar por DNI encuentre al paciente sin
 * importar cómo lo tipeó quien cargó el turno.
 */
export function normalizeDni(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * El consentimiento no vive en el schema: un turno cargado por Rosa desde el
 * panel no lo necesita, sólo los que saca el paciente. La regla está en
 * `createBooking`, y el mensaje acá para que el formulario diga exactamente lo
 * mismo que el servidor.
 */
export const CONSENT_REQUIRED_MESSAGE = "Necesitamos tu consentimiento para guardar tus datos.";

export const bookingSchema = z.object({
  /** Con quién es el turno. No hay reserva sin profesional. */
  practitionerId: z.uuid("Elegí un profesional"),
  startsAt: z.iso.datetime({ offset: true }),
  patientFirstName: z.string().trim().min(2, "Ingresá tu nombre").max(80),
  patientLastName: z.string().trim().min(2, "Ingresá tu apellido").max(80),
  patientDni: z
    .string()
    .trim()
    .transform(normalizeDni)
    // Los DNI argentinos vigentes tienen 7 u 8 dígitos.
    .refine((value) => value.length >= 7 && value.length <= 8, "Ingresá un DNI válido"),
  patientCoverage: z.enum(COVERAGE_VALUES, "Elegí tu obra social"),
  patientPhone: z
    .string()
    .trim()
    .min(6, "Ingresá un teléfono válido")
    .max(30)
    .transform(normalizePhone)
    .refine((value) => value.replace(/\D/g, "").length >= 8, "Ingresá un teléfono válido"),
  // Optional, and a DATO SENSIBLE under Ley 25.326 art. 2.
  motivo: z
    .string()
    .trim()
    .max(500, "El motivo no puede superar los 500 caracteres")
    .optional()
    .or(z.literal("")),
  /** Must be explicitly true for an online booking; recorded as consent_at. */
  consent: z.boolean(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
