import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PHOTOS, PLACEHOLDER_PHOTO, photoForPractitioner } from "./team-photos";

describe("photoForPractitioner", () => {
  it("uses the silhouette for someone without a photo", () => {
    expect(photoForPractitioner("sin-foto")).toEqual({
      src: PLACEHOLDER_PHOTO,
      isPlaceholder: true,
    });
  });

  it("points every photo, and the silhouette, at a file that exists", () => {
    // Una foto renombrada tiene que romper el test, no dejar una imagen rota en el sitio.
    for (const src of [PLACEHOLDER_PHOTO, ...Object.values(PHOTOS)]) {
      expect(existsSync(path.join(process.cwd(), "public", src)), src).toBe(true);
    }
  });
});
