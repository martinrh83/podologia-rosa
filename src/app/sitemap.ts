import type { MetadataRoute } from "next";

import { listActivePractitioners } from "@/lib/db/practitioners";
import { siteUrl } from "@/lib/env";

// Lee los profesionales de la base: si se prerenderizara, dar de alta a alguien
// no lo agregaría al sitemap hasta el próximo deploy.
export const dynamic = "force-dynamic";

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
    { url: `${base}/servicios`, lastModified, priority: 0.8 },
    { url: `${base}/como-llegar`, lastModified, priority: 0.7 },
    { url: `${base}/equipo`, lastModified, priority: 0.6 },
    { url: `${base}/privacidad`, lastModified, priority: 0.3 },
  ];
}
