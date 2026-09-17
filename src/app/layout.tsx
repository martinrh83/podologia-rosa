import type { Metadata } from "next";
import { Archivo, Kalam } from "next/font/google";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

import { listActivePractitioners } from "@/lib/db/practitioners";
import { getActiveServices } from "@/lib/db/services";

import "./globals.css";

/**
 * Archivo, de Omnibus-Type (Buenos Aires): la letra de imprenta de la tarjeta.
 * Variable con eje de ancho, para titulares anchos y rótulos angostos con una
 * sola familia.
 */
const archivo = Archivo({
  variable: "--font-sans-stack",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

/**
 * Kalam: lo que se completa a mano en birome. Sólo para datos cortos y a tamaño
 * generoso; nunca para texto corrido.
 */
const kalam = Kalam({
  variable: "--font-hand-stack",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    // "Salta" en el título: es lo que más pesa para "podología Salta".
    default: "Podología Mitre Salta",
    template: "%s | Podología Mitre",
  },
  description:
    "Consultorio de podología en Salta Capital. Sacá tu turno online en menos de un minuto, sin llamar ni crear una cuenta.",
  // es-AR so search engines and screen readers get the right variety of Spanish.
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Podología Mitre",
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
  { href: "/#team", label: "Profesionales", requires: "practitioners" },
  { href: "/#directions", label: "Cómo llegar" },
  { href: "/#faq", label: "Preguntas frecuentes" },
];

/**
 * Un ancla a una sección que no existe no lleva a ningún lado, así que el menú
 * se arma con lo que el home realmente va a renderizar.
 *
 * Tratamientos y "profesionales" desaparecen si no hay nada cargado — y
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
    <html lang="es-AR" className={`${archivo.variable} ${kalam.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col">
        <SiteHeader nav={nav} />

        {/* `clip` y no `hidden`: recorta lo que asoma de costado (un sello, una tarjeta girada) sin crear un contenedor de scroll que rompa el encabezado fijo. */}
        <main className="flex-1 overflow-x-clip">{children}</main>

        {/* El pie es el borde de abajo de la tarjeta: troquel y letra chica. */}
        <footer className="mt-16">
          <div aria-hidden className="perforado h-1.5" />
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="font-narrow font-semibold uppercase tracking-[0.08em]">
              © {new Date().getFullYear()} Podología Mitre · Salta
            </p>
            <Link
              href="/privacidad"
              className="-my-2 inline-block py-2.5 underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground"
            >
              Privacidad y datos personales
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
