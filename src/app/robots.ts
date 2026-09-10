import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin is private, and a cancel link is a credential — neither should
      // ever be crawled. Both also send noindex headers of their own.
      disallow: ["/admin", "/admin/", "/turnos/cancelar/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
