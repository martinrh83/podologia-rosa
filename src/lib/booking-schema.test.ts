import { describe, expect, it } from "vitest";

import { bookingSchema, normalizePhone } from "./booking-schema";

describe("normalizePhone", () => {
  it("collapses the ways an Argentine number gets typed into one value", () => {
    // These are all the same person. If they normalised differently, the
    // per-contact cap would count them as different patients.
    const variants = ["+54 9 11 5555-4444", "+54-9-11-5555 4444", "+5491155554444"];

    expect(new Set(variants.map(normalizePhone)).size).toBe(1);
    expect(normalizePhone(variants[0])).toBe("+5491155554444");
  });

  it("keeps local formats without a country code distinct but stable", () => {
    // 011 + 15 + 5555 + 4444 = 13 digits, no country code, no leading plus.
    expect(normalizePhone("(011) 15 5555 4444")).toBe("0111555554444");
    expect(normalizePhone("11 5555-4444")).toBe("1155554444");
  });

  it("preserves a leading plus but strips everything else", () => {
    expect(normalizePhone("  +54 (9) 11·5555·4444  ")).toBe("+5491155554444");
    expect(normalizePhone("11.5555.4444")).toBe("1155554444");
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

    expect(parsed.patientPhone).toBe("+5491155554444");
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
