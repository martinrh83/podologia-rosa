import { SectionHeading } from "@/components/home/section-heading";
import type { ServiceWithSpecialty } from "@/lib/db/types";

/**
 * Los tratamientos, sin precios, como el dorso impreso de la tarjeta.
 *
 * Los precios siguen en la base y en el panel como referencia interna, pero no
 * se publican: se los dice la profesional en la consulta. Eso además evita que
 * un número quede desactualizado a la vista con la inflación.
 *
 * RENGLONES, NO TARJETAS
 *
 *   Cada tratamiento es un renglón del formulario con su casilla ya tildada en
 *   birome: "esto se hace acá". La casilla está marcada a propósito; vacía se
 *   leería como algo para tocar.
 *
 * Devuelve null si no hay nada cargado. Un bloque con el título y nada abajo se
 * lee peor que no tenerlo, y el home fluye igual sin él.
 */
export function Treatments({ services }: { services: ServiceWithSpecialty[] }) {
  if (services.length === 0) return null;

  return (
    <section id="treatments" className="scroll-mt-7">
      <div aria-hidden className="perforado h-1.5" />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading>Tratamientos</SectionHeading>

        <ul className="mt-2 grid border-b border-border sm:grid-cols-2 sm:gap-x-12">
          {services.map((service) => (
            <li key={service.id} className="flex gap-4 border-t border-border py-6 first:border-t-0 sm:[&:nth-child(2)]:border-t-0">
              <Tick />
              <div className="min-w-0">
                <h3 className="text-[1.3rem] font-bold leading-tight tracking-[-0.01em]">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="mt-1.5 max-w-[46ch] leading-relaxed text-muted">
                    {service.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** La casilla impresa en tinta, con el tilde en birome que la cruza. */
function Tick() {
  return (
    <svg aria-hidden viewBox="0 0 30 30" className="mt-0.5 size-7 shrink-0">
      <rect x="2" y="5" width="21" height="21" fill="none" stroke="var(--foreground)" strokeWidth="2" />
      <path
        d="M6.5 15.5c2 1.4 3.6 3.2 5 5.6C15 13.6 20.2 7.4 27.5 2.5"
        fill="none"
        stroke="var(--birome)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
