import { describe, expect, it } from "vitest";

import { summarizeWeek } from "./week-summary";

const shift = (weekday: number, start_time: string, end_time: string) => ({
  weekday,
  start_time,
  end_time,
});

describe("summarizeWeek", () => {
  it("resume una semana pareja en días y horas", () => {
    const schedule = [1, 2, 3, 4, 5, 6].map((day) => shift(day, "09:00:00", "18:00:00"));

    expect(summarizeWeek(schedule)).toEqual({ days: "Lunes a sábado", hours: "de 9 a 18 hs" });
  });

  it("si las horas cambian según el día, da de la primera apertura al último cierre", () => {
    const schedule = [
      shift(1, "08:00:00", "12:00:00"),
      shift(1, "16:00:00", "20:00:00"),
      shift(2, "16:00:00", "20:00:00"),
      shift(6, "09:00:00", "13:00:00"),
    ];

    expect(summarizeWeek(schedule)).toEqual({ days: "Lunes, martes y sábado", hours: "de 8 a 20 hs" });
  });

  it("cuenta una sola vez la franja que comparten dos profesionales", () => {
    const schedule = [
      shift(1, "08:00:00", "12:00:00"),
      shift(1, "08:00:00", "12:00:00"),
      shift(2, "08:00:00", "12:00:00"),
      shift(3, "08:00:00", "12:00:00"),
    ];

    expect(summarizeWeek(schedule)).toEqual({ days: "Lunes a miércoles", hours: "de 8 a 12 hs" });
  });

  it("junta las franjas partidas y respeta los minutos", () => {
    const schedule = [4, 5].flatMap((day) => [
      shift(day, "08:30", "12:00"),
      shift(day, "16:00", "20:30"),
    ]);

    expect(summarizeWeek(schedule)).toEqual({
      days: "Jueves y viernes",
      hours: "de 8:30 a 12 y de 16 a 20:30 hs",
    });
  });

  it("arranca la semana el lunes: sábado y domingo van seguidos", () => {
    const schedule = [1, 2, 3, 6, 0].map((day) => shift(day, "09:00", "13:00"));

    expect(summarizeWeek(schedule)?.days).toBe("Lunes a miércoles, sábado y domingo");
  });

  it("no inventa nada sin agenda cargada", () => {
    expect(summarizeWeek([])).toBeNull();
  });
});
