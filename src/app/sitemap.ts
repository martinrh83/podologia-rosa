import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();

  return [
    { url: base, lastModified, priority: 1 },
    { url: `${base}/turnos`, lastModified, priority: 0.9 },
    { url: `${base}/servicios`, lastModified, priority: 0.8 },
    { url: `${base}/como-llegar`, lastModified, priority: 0.7 },
    { url: `${base}/sobre-mi`, lastModified, priority: 0.6 },
    { url: `${base}/privacidad`, lastModified, priority: 0.3 },
  ];
}
