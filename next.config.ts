import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `/servicios` dejó de existir: los tratamientos viven en el home, sin precios.
   *
   * El redirect está por los links que ya circularon —estuvo en el sitemap y en
   * el nav— y porque un 308 le dice a Google que mueva la autoridad de esa URL
   * al home, en vez de tratarla como contenido perdido.
   */
  async redirects() {
    return [{ source: "/servicios", destination: "/#tratamientos", permanent: true }];
  },
};

export default nextConfig;
