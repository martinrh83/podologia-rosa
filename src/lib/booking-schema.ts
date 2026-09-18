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
export const CONSENT_REQUIRED_MESSAGE = "Marcá la casilla para que podamos guardar tus datos";

/**
 * Los mensajes de cada campo, según quién escribe.
 *
 * Las reglas son las mismas en la reserva y en «Nuevo turno»; lo que cambia es
 * a quién se le habla. En el sitio el paciente escribe sus datos («Ingresá tu
 * nombre»); en el panel la recepción escribe los de otra persona, y «tu nombre»
 * le pedía el suyo.
 */
const VOICES = {
  paciente: {
    practitionerId: "Elegí un profesional",
    startsAt: "Elegí un horario",
    firstName: "Ingresá tu nombre",
    lastName: "Ingresá tu apellido",
    dni: "Ingresá un DNI válido",
    coverage: "Elegí tu obra social",
    phone: "Ingresá un teléfono válido",
  },
  personal: {
    practitionerId: "Elegí un profesional",
    startsAt: "Elegí un horario",
    firstName: "Ingresá el nombre",
    lastName: "Ingresá el apellido",
    dni: "Ingresá un DNI válido",
    coverage: "Elegí la obra social",
    phone: "Ingresá un teléfono válido",
  },
} as const;

export function bookingSchemaFor(voice: keyof typeof VOICES) {
  const say = VOICES[voice];

  return z.object({
    /** Con quién es el turno. No hay reserva sin profesional. */
    practitionerId: z.uuid(say.practitionerId),
    startsAt: z.iso.datetime({ offset: true, error: say.startsAt }),
    patientFirstName: z.string(say.firstName).trim().min(2, say.firstName).max(80, "Es demasiado largo"),
    patientLastName: z.string(say.lastName).trim().min(2, say.lastName).max(80, "Es demasiado largo"),
    patientDni: z
      .string(say.dni)
      .trim()
      .transform(normalizeDni)
      // Los DNI argentinos vigentes tienen 7 u 8 dígitos.
      .refine((value) => value.length >= 7 && value.length <= 8, say.dni),
    patientCoverage: z.enum(COVERAGE_VALUES, say.coverage),
    patientPhone: z
      .string(say.phone)
      .trim()
      .min(6, say.phone)
      .max(30, say.phone)
      .transform(normalizePhone)
      .refine((value) => value.replace(/\D/g, "").length >= 8, say.phone),
    // Optional, and a DATO SENSIBLE under Ley 25.326 art. 2.
    motivo: z
      .string("El motivo tiene que ser texto")
      .trim()
      .max(500, "El motivo no puede superar los 500 caracteres")
      .optional()
      .or(z.literal("")),
    /** Must be explicitly true for an online booking; recorded as consent_at. */
    consent: z.boolean(CONSENT_REQUIRED_MESSAGE),
  });
}

/** La reserva pública, en la voz del paciente. */
export const bookingSchema = bookingSchemaFor("paciente");

/** «Nuevo turno» del panel: las mismas reglas, habladas por la recepción. */
export const adminBookingSchema = bookingSchemaFor("personal");

export type BookingInput = z.infer<typeof bookingSchema>;
