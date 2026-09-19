import { describe, expect, it } from "vitest";

import { firstWord, fullName, shortName } from "./person-name";
import { slugify } from "./slug";

describe("el nombre corto", () => {
  it("toma el primer nombre y el primer apellido", () => {
    expect(shortName("Rosa Beatriz", "Heredia Montaño")).toBe("Rosa Heredia");
    expect(shortName("Patricia Elena", "Díaz")).toBe("Patricia Díaz");
  });

  it("aguanta un apellido vacío y los espacios de más", () => {
    expect(shortName("  Ana  ", "")).toBe("Ana");
    expect(firstWord("")).toBe("");
  });

  it("deja el nombre completo para elegir profesional", () => {
    expect(fullName("Rosa Beatriz", "Heredia Montaño")).toBe("Rosa Beatriz Heredia Montaño");
  });

  it("arma la dirección del perfil", () => {
    expect(slugify(shortName("Rosa Beatriz", "Heredia Montaño"))).toBe("rosa-heredia");
  });
});
