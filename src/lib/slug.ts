/**
 * "Ana Gómez Pérez" -> "ana-gomez-perez". Sin tildes ni signos.
 *
 * Vive acá y no en las acciones porque un archivo `"use server"` sólo puede
 * exportar funciones async: todo lo que exporta queda expuesto como endpoint.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Rutas que no puede tomar un slug, porque ya son páginas.
 *
 * `/turnos/cancelar/[token]` gana contra `/turnos/[slug]` por ser una ruta
 * estática, así que un profesional con slug "cancelar" no rompería nada hoy —
 * pero tendría una URL que nunca se puede abrir. Mejor que no exista.
 */
export const RESERVED_SLUGS = new Set(["cancelar", "nuevo", "admin", "api"]);
