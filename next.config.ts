import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Tres páginas se volvieron secciones del home.
   *
   * El redirect está por los links que ya circularon —estuvo en el sitemap y en
   * el nav— y porque un 308 le dice a Google que mueva la autoridad de esa URL
   * al home, en vez de tratarla como contenido perdido.
   */
  async redirects() {
    return [
      { source: "/servicios", destination: "/#tratamientos", permanent: true },
      { source: "/equipo", destination: "/#equipo", permanent: true },
      { source: "/como-llegar", destination: "/#como-llegar", permanent: true },
    ];
  },
};

export default nextConfig;
