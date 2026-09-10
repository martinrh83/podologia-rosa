import { describe, expect, it } from "vitest";

import { formatDay, formatPrice, formatTime, toLocalDateKey, whatsappLink } from "./format";

describe("formatters render in clinic-local time regardless of server zone", () => {
  // 2026-09-10T22:30Z is 19:30 in Buenos Aires on the same day.
  const evening = new Date("2026-09-10T22:30:00.000Z");
  // 2026-09-11T02:00Z is 23:00 on the 10th locally — a different calendar day
  // in UTC than in Argentina, which is where naive formatting goes wrong.
  const lateNight = new Date("2026-09-11T02:00:00.000Z");

  it("formats the local hour, not the UTC hour", () => {
    expect(formatTime(evening)).toBe("19:30");
    expect(formatTime(lateNight)).toBe("23:00");
  });

  it("keeps a late turno on the correct local date", () => {
    expect(toLocalDateKey(lateNight)).toBe("2026-09-10");
    expect(formatDay(lateNight)).toContain("10");
  });

  it("writes the day in Spanish", () => {
    expect(formatDay(evening)).toBe("jueves, 10 de septiembre");
  });
});

describe("formatPrice", () => {
  it("renders pesos without decimal noise", () => {
    expect(formatPrice(15000)).toContain("15.000");
    expect(formatPrice(15000)).not.toContain(",00");
  });

  it("returns null when Rosa has not set a price", () => {
    expect(formatPrice(null)).toBeNull();
  });
});

describe("whatsappLink", () => {
  it("strips formatting from the number and encodes the message", () => {
    const link = whatsappLink("+54 9 11 5555-4444", "Hola Ana, te recordamos tu turno");

    expect(link).toContain("https://wa.me/5491155554444");
    expect(link).toContain("Hola%20Ana");
  });
});
