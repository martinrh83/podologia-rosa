import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

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

const NAV = [
  { href: "/servicios", label: "Servicios" },
  { href: "/sobre-mi", label: "Sobre mí" },
  { href: "/como-llegar", label: "Cómo llegar" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${geist.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Podología <span className="text-accent">Rosa</span>
            </Link>

            <nav aria-label="Principal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[0.95rem] text-muted transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/turnos"
              className="ml-auto rounded-lg bg-accent px-4 py-2.5 text-[0.95rem] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Sacar un turno
            </Link>
          </div>
        </header>

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
