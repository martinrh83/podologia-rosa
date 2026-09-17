import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { MAPS, mapForAddress, normalizeAddress } from "./maps";

describe("normalizeAddress", () => {
  it("ignores case, accents and extra spaces", () => {
    expect(normalizeAddress("  BARTOLOMÉ   Mitre 496 ")).toBe("bartolome mitre 496");
  });

  it("drops everything after the first comma, like the city", () => {
    expect(normalizeAddress("Olavarría 1130, Salta")).toBe("olavarria 1130");
  });
});

describe("mapForAddress", () => {
  it("finds the map however the address was typed in the panel", () => {
    expect(mapForAddress("Bartolomé Mitre 496, Salta")?.src).toBe("/maps/centro.svg");
    expect(mapForAddress("olavarria 1130")?.src).toBe("/maps/san-jose.svg");
  });

  it("returns nothing for an address without a map", () => {
    // Una sede que se mudó no puede seguir mostrando el mapa del lugar viejo.
    expect(mapForAddress("Bartolomé Mitre 500, Salta")).toBeNull();
    expect(mapForAddress("Completar con la dirección real, Salta")).toBeNull();
  });

  it("points every map at a file that exists", () => {
    // Un SVG renombrado tiene que romper el test, no dejar una imagen rota en el sitio.
    for (const map of Object.values(MAPS)) {
      expect(existsSync(path.join(process.cwd(), "public", map.src)), map.src).toBe(true);
    }
  });

  it("keys the table by normalized addresses", () => {
    for (const key of Object.keys(MAPS)) {
      expect(normalizeAddress(key)).toBe(key);
    }
  });
});
