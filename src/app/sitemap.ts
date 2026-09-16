import type { MetadataRoute } from "next";

import { listActivePractitioners } from "@/lib/db/practitioners";
import { siteUrl } from "@/lib/env";

/**
 * Estática, y la reconstruye el panel.
 *
 * Esto no se renderiza por visita: son datos de catálogo que sólo cambian
 * cuando alguien edita el consultorio, y cada acción que los toca ya llama a
 * `revalidatePath()` sobre esta ruta — así que dar de baja a un profesional o
 * corregir un precio se ve en el acto, sin esperar un deploy.
 *
 * El `revalidate` es la red de seguridad para lo que entra por fuera de la app
 * (una corrección a mano en Studio, un script): sin él, un cambio que no pase
 * por una acción no se vería nunca.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const lastModified = new Date();
  const practitioners = await listActivePractitioners();

  return [
    { url: base, lastModified, priority: 1 },
    { url: `${base}/turnos`, lastModified, priority: 0.9 },
    // La agenda de cada profesional es una página propia justamente para esto:
    // "podóloga <nombre> <ciudad>" es el tipo de búsqueda que trae pacientes.
    ...practitioners.map((practitioner) => ({
      url: `${base}/turnos/${practitioner.slug}`,
      lastModified,
      priority: 0.8,
    })),
    { url: `${base}/privacidad`, lastModified, priority: 0.3 },
  ];
}
