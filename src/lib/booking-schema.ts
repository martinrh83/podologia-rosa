import { z } from "zod";

/**
 * Booking input validation. Deliberately *outside* the `server-only` boundary:
 * the same schema validates on the client for instant feedback and on the server
 * as the actual gate, and keeping it importable also makes it unit-testable.
 */

/**
 * Normalise an Argentine phone number to digits, keeping a leading `+`.
 *
 * Patients type "11 5555-4444", "(011) 15 5555 4444", "+54 9 11 5555 4444".
 * This matters beyond tidiness: the per-contact cap counts by phone, so without
 * normalising, the same person could bypass the limit just by reformatting.
 */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
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
