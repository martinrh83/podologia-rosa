import { describe, expect, it } from "vitest";

import { shiftsOverlap } from "./shifts";

describe("shiftsOverlap", () => {
  it("detecta el solapamiento parcial", () => {
    expect(shiftsOverlap("10:00", "14:00", "08:00", "12:00")).toBe(true);
    expect(shiftsOverlap("08:00", "12:00", "10:00", "14:00")).toBe(true);
  });

  it("detecta una franja contenida en otra", () => {
    expect(shiftsOverlap("09:00", "10:00", "08:00", "12:00")).toBe(true);
    expect(shiftsOverlap("08:00", "12:00", "09:00", "10:00")).toBe(true);
  });

  it("no considera solapadas dos franjas que se tocan", () => {
    // El corte del mediodía: 08:00-12:00 y 12:00-16:00 conviven.
    expect(shiftsOverlap("12:00", "16:00", "08:00", "12:00")).toBe(false);
    expect(shiftsOverlap("08:00", "12:00", "12:00", "16:00")).toBe(false);
  });

  it("no confunde el formato de la base con el del formulario", () => {
    // Ésta es la razón de ser del recorte. Postgres devuelve "12:00:00" y el
    // formulario manda "12:00"; sin normalizar, "12:00" < "12:00:00" da
    // verdadero porque es un prefijo, y el corte del mediodía se volvería
    // imposible de cargar.
    expect(shiftsOverlap("12:00", "16:00", "08:00:00", "12:00:00")).toBe(false);
    expect(shiftsOverlap("08:00:00", "12:00:00", "12:00", "16:00")).toBe(false);

    // Y lo que sí se pisa lo sigue detectando con formatos mezclados.
    expect(shiftsOverlap("11:30", "16:00", "08:00:00", "12:00:00")).toBe(true);
  });

  it("no se pisan dos franjas separadas", () => {
    expect(shiftsOverlap("16:00", "20:00", "08:00", "12:00")).toBe(false);
  });
});
