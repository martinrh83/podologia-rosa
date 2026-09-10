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

export const bookingSchema = z.object({
  startsAt: z.iso.datetime({ offset: true }),
  patientName: z.string().trim().min(2, "Ingresá tu nombre").max(120),
  patientPhone: z
    .string()
    .trim()
    .min(6, "Ingresá un teléfono válido")
    .max(30)
    .transform(normalizePhone)
    .refine((value) => value.replace(/\D/g, "").length >= 8, "Ingresá un teléfono válido"),
  patientEmail: z.email("Ingresá un email válido").max(200).optional().or(z.literal("")),
  // Optional, and a DATO SENSIBLE under Ley 25.326 art. 2.
  motivo: z.string().trim().max(500).optional().or(z.literal("")),
  /** Must be explicitly true for an online booking; recorded as consent_at. */
  consent: z.boolean(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
