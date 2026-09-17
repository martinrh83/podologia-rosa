/**
 * El mapa de cada sede para la sección "Cómo llegar".
 *
 * Los SVG están en `public/maps/` y los genera `scripts/generate-maps.mjs` con
 * datos de OpenStreetMap. Diseño: docs/plans/2026-09-17-mapas-como-llegar-design.md
 *
 * POR QUÉ SE BUSCAN POR DIRECCIÓN
 *
 *   Las sedes se cargan desde el panel y los mapas viven en el repo: algo tiene
 *   que unirlos. El mapa depende de la dirección, no del nombre. Si Rosa cambia
 *   la dirección, el mapa deja de mostrarse en vez de seguir marcando el lugar
 *   viejo, y la sección funciona igual sin él. Por eso tampoco hay una columna
 *   nueva en `locations`.
 *
 *   Una sede que se muda pide correr el script con la coordenada nueva y
 *   agregar su fila acá.
 */

export type LocationMap = {
  src: string;
  /** Lo que el mapa le dice a quien no lo ve: las calles que cruzan. */
  alt: string;
};

/** Claves ya normalizadas con `normalizeAddress`. */
export const MAPS: Record<string, LocationMap> = {
  "bartolome mitre 496": {
    src: "/maps/centro.svg",
    alt: "Mapa: Bartolomé Mitre 496, esquina Leguizamón, entre Rivadavia y Santiago del Estero.",
  },
  "olavarria 1130": {
    src: "/maps/san-jose.svg",
    alt: "Mapa: Olavarría 1130, a metros de Mariano Moreno.",
  },
};

/** Minúsculas, sin tildes ni espacios de más, y sin lo que va después de la coma. */
export function normalizeAddress(address: string): string {
  return address
    .split(",")[0]
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function mapForAddress(address: string): LocationMap | null {
  return MAPS[normalizeAddress(address)] ?? null;
}
