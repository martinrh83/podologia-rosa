import { describe, expect, it } from "vitest";

import { bookingSchema, normalizePhone } from "./booking-schema";

describe("normalizePhone", () => {
  it("collapses every way one Argentine number gets typed into a single value", () => {
    // All the same Buenos Aires line. If any of these normalised differently the
    // per-contact cap would count one person as several and stop working --
    // which is exactly the bug this replaced.
    const variants = [
      "11 5555-4444",
      "1155554444",
      "+54 9 11 5555-4444",
      "+5491155554444",
      "54 9 11 5555 4444",
      "(011) 15 5555 4444",
      "011 15 5555-4444",
      "0111555554444",
    ];

    const normalised = new Set(variants.map(normalizePhone));

    expect(normalised).toEqual(new Set(["1155554444"]));
  });

  it("handles 3- and 4-digit area codes, not just Buenos Aires", () => {
    // Cordoba (351) and a smaller locality (2954); both are 10 digits national.
    expect(normalizePhone("+54 9 351 555-4444")).toBe("3515554444");
    expect(normalizePhone("0351 15 555-4444")).toBe("3515554444");
    expect(normalizePhone("+54 9 2954 55-4444")).toBe("2954554444");
    expect(normalizePhone("02954 15 55-4444")).toBe("2954554444");
  });

  it("leaves a landline without a mobile prefix alone", () => {
    expect(normalizePhone("011 4555-4444")).toBe("1145554444");
    expect(normalizePhone("+54 11 4555 4444")).toBe("1145554444");
  });

  it("strips punctuation and whitespace of every kind", () => {
    expect(normalizePhone("  11.5555.4444  ")).toBe("1155554444");
    expect(normalizePhone("11\u00b75555\u00b74444")).toBe("1155554444");
  });

  it("returns bare digits for anything that is not an AR number", () => {
    // A foreign number still normalises consistently, just not canonically.
    expect(normalizePhone("+1 (415) 555-2671")).toBe("14155552671");
  });
});

describe("bookingSchema", () => {
  const valid = {
    startsAt: "2026-09-10T12:00:00.000Z",
    patientName: "Rosa Gómez",
    patientPhone: "+54 9 11 5555-4444",
    patientEmail: "rosa@example.com",
    motivo: "",
    consent: true,
  };

  it("accepts a well-formed booking and normalises the phone", () => {
    const parsed = bookingSchema.parse(valid);

    expect(parsed.patientPhone).toBe("1155554444");
    expect(parsed.patientName).toBe("Rosa Gómez");
  });

  it("treats the email as optional, since not every patient has one", () => {
    expect(bookingSchema.parse({ ...valid, patientEmail: "" }).patientEmail).toBe("");
    expect(bookingSchema.parse({ ...valid, patientEmail: undefined }).patientEmail).toBeUndefined();
  });

  it("rejects a malformed email rather than silently dropping it", () => {
    // Silently discarding it would mean no confirmation and no cancel link.
    expect(bookingSchema.safeParse({ ...valid, patientEmail: "rosa@" }).success).toBe(false);
  });

  it("rejects a phone too short to be real", () => {
    expect(bookingSchema.safeParse({ ...valid, patientPhone: "1234" }).success).toBe(false);
  });

  it("rejects a name that is blank or a single character", () => {
    expect(bookingSchema.safeParse({ ...valid, patientName: "   " }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, patientName: "R" }).success).toBe(false);
  });

  it("requires a timestamp with an explicit offset", () => {
    // A bare local time is ambiguous, and guessing the zone is how turnos end up
    // three hours out.
    expect(bookingSchema.safeParse({ ...valid, startsAt: "2026-09-10T12:00:00" }).success).toBe(
      false,
    );
    expect(bookingSchema.safeParse({ ...valid, startsAt: "2026-09-10" }).success).toBe(false);
  });

  it("caps motivo length so the free-text field cannot become a clinical history", () => {
    expect(bookingSchema.safeParse({ ...valid, motivo: "x".repeat(501) }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, motivo: "Uña encarnada" }).success).toBe(true);
  });
});
