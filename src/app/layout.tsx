import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

import { listActivePractitioners } from "@/lib/db/practitioners";
import { getActiveServices } from "@/lib/db/services";

import "./globals.css";

const geist = Geist({
  variable: "--font-sans-stack",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Podología Rosa — Turnos online",
    template: "%s | Podología Rosa",
  },
  description:
    "Consultorio de podología. Sacá tu turno online en menos de un minuto, sin llamar ni crear una cuenta.",
  // es-AR so search engines and screen readers get the right variety of Spanish.
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Podología Rosa",
  },
};

/**
 * El menú apunta a secciones del home, no a páginas.
 *
 * Tratamientos, quién atiende y cómo llegar eran tres páginas con poco
 * contenido cada una, y el home ya repetía parte. Como secciones de una sola
 * página el sitio se lee de corrido y el camino al turno es más corto.
 *
 * Los href van con `/` adelante a propósito: desde /turnos o /privacidad un
 * `#treatments` pelado no llevaría a ningún lado.
 *
 * `/turnos` sigue siendo página — es el embudo, y cada profesional tiene su
 * propia URL para que una búsqueda por nombre caiga donde se saca el turno.
 */
type NavLink = { href: string; label: string; /** Cuándo tiene sentido ofrecerla. */ requires?: "services" | "practitioners" };

const NAV: NavLink[] = [
  { href: "/#treatments", label: "Tratamientos", requires: "services" },
  { href: "/#team", label: "Quién te atiende", requires: "practitioners" },
  { href: "/#directions", label: "Cómo llegar" },
  { href: "/#faq", label: "Preguntas" },
];

/**
 * Un ancla a una sección que no existe no lleva a ningún lado, así que el menú
 * se arma con lo que el home realmente va a renderizar.
 *
 * Tratamientos y "quién te atiende" desaparecen si no hay nada cargado — y
 * producción estuvo exactamente así, sin servicios, después de que 0016 borrara
 * el catálogo de ejemplo.
 *
 * Cuesta dos consultas, que en las páginas públicas se pagan una vez por
 * revalidación porque son estáticas, y en el home son gratis: Next deduplica
 * las mismas consultas dentro de un render y la página ya las hace.
 */
async function visibleNav() {
  const [services, practitioners] = await Promise.all([
    getActiveServices(),
    listActivePractitioners(),
  ]);

  return NAV.filter((item) => {
    if (item.requires === "services") return services.length > 0;
    if (item.requires === "practitioners") return practitioners.length > 0;
    return true;
  });
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nav = await visibleNav();

  return (
    <html lang="es-AR" className={`${geist.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col">
        <SiteHeader nav={nav} />

        <main className="flex-1">{children}</main>

        <footer className="mt-16 border-t border-border bg-surface">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Podología Rosa</p>
            <Link href="/privacidad" className="hover:text-foreground">
              Privacidad y datos personales
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
