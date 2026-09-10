import { describe, expect, it } from "vitest";

import { bookingSchema, normalizeDni, normalizePhone } from "./booking-schema";

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

describe("normalizeDni", () => {
  it("collapses the ways a DNI gets typed", () => {
    // El mismo documento escrito de cuatro formas.
    const variants = ["20123456", "20.123.456", "20 123 456", " 20-123-456 "];

    expect(new Set(variants.map(normalizeDni))).toEqual(new Set(["20123456"]));
  });
});

describe("bookingSchema", () => {
  const valid = {
    startsAt: "2026-09-10T12:00:00.000Z",
    patientFirstName: "Rosa",
    patientLastName: "Gómez",
    patientDni: "20.123.456",
    patientCoverage: "osunsa" as const,
    patientPhone: "+54 9 11 5555-4444",
    motivo: "",
    consent: true,
  };

  it("accepts a well-formed booking and normalises the phone", () => {
    const parsed = bookingSchema.parse(valid);

    expect(parsed.patientPhone).toBe("1155554444");
    expect(parsed.patientFirstName).toBe("Rosa");
    expect(parsed.patientLastName).toBe("Gómez");
    expect(parsed.patientDni).toBe("20123456");
  });

  it("rejects a phone too short to be real", () => {
    expect(bookingSchema.safeParse({ ...valid, patientPhone: "1234" }).success).toBe(false);
  });

  it("rejects a name or surname that is blank or a single character", () => {
    expect(bookingSchema.safeParse({ ...valid, patientFirstName: "   " }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, patientLastName: "G" }).success).toBe(false);
  });

  it("accepts the three coverages and nothing else", () => {
    for (const coverage of ["ips", "osunsa", "particular"]) {
      expect(bookingSchema.safeParse({ ...valid, patientCoverage: coverage }).success).toBe(true);
    }

    // Una obra social que el consultorio no acepta no puede entrar por la API,
    // aunque el formulario sólo ofrezca tres opciones.
    expect(bookingSchema.safeParse({ ...valid, patientCoverage: "osde" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, patientCoverage: "" }).success).toBe(false);
  });

  it("normalises the DNI and rejects one of the wrong length", () => {
    expect(bookingSchema.parse({ ...valid, patientDni: "20.123.456" }).patientDni).toBe("20123456");
    expect(bookingSchema.parse({ ...valid, patientDni: "9 876 543" }).patientDni).toBe("9876543");

    expect(bookingSchema.safeParse({ ...valid, patientDni: "123456" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, patientDni: "123456789" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...valid, patientDni: "" }).success).toBe(false);
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
