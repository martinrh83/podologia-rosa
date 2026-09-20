/**
 * La foto de cada profesional para la sección "Profesionales" del home.
 *
 * Archivos en `public/team/`, no en Supabase Storage: una foto cambia una vez
 * por año, y subirlas desde el panel pedía un bucket, permisos, un formulario de
 * subida e imágenes remotas en `next/image`. Cambiar una foto es un commit.
 *
 * Se buscan por `slug`, que es estable: no se regenera si cambia el nombre.
 * Quien no tiene foto muestra la silueta, en el mismo encuadre que tendrá la
 * foto real, así la sección no cambia de forma el día que llegue.
 *
 * Para sumar una foto: `public/team/<slug>.webp`, en 4:5, y una fila acá.
 */

export const PLACEHOLDER_PHOTO = "/team/team-placeholder.webp";

export const PHOTOS: Record<string, string> = {
  "rosa-heredia": "/team/rosa-heredia.webp",
  "patricia-diaz": "/team/patricia-diaz.webp",
};

export function photoForPractitioner(slug: string): { src: string; isPlaceholder: boolean } {
  const src = PHOTOS[slug];
  return src ? { src, isPlaceholder: false } : { src: PLACEHOLDER_PHOTO, isPlaceholder: true };
}
