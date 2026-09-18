import type { Metadata } from "next";
import Link from "next/link";

import {
  Counter,
  PASOS,
  Notice,
  Pendientes,
  StepHeading,
  TurnoCard,
  type TurnoLine,
} from "@/components/booking/counter";
import { getClinicSettings } from "@/lib/availability";
import { listActivePractitioners, practitionerName } from "@/lib/db/practitioners";
import type { PractitionerWithSpecialty } from "@/lib/db/types";

export const metadata: Metadata = {
  title: "Sacar un turno",
  description:
    "Elegí con quién te querés atender y mirá sus horarios disponibles. No hace falta crear una cuenta ni llamar por teléfono.",
};

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

export default async function TurnosPage() {
  const [practitioners, settings] = await Promise.all([
    listActivePractitioners(),
    getClinicSettings(),
  ]);

  // Agrupar por especialidad sólo tiene sentido cuando hay más de una: con una
  // sola, el título repetiría lo que ya dice el sitio entero.
  const groups = new Map<string, PractitionerWithSpecialty[]>();
  for (const practitioner of practitioners) {
    const key = practitioner.specialty?.name ?? "Otros";
    groups.set(key, [...(groups.get(key) ?? []), practitioner]);
  }
  const showSpecialtyHeadings = groups.size > 1;

  // La tarjeta arranca en blanco: es el turno que el paciente va a armar.
  const lines: TurnoLine[] = [
    { label: "Con", placeholder: "lo elegís vos" },
    { label: "Día y hora", placeholder: "lo elegís vos" },
    { label: "A nombre de", placeholder: "tus datos" },
  ];

  return (
    <Counter
      aside={
        <>
          <TurnoCard lines={lines} className="max-lg:hidden" />
          <Pendientes items={PASOS} current={0} />
        </>
      }
    >
      <StepHeading
        step={1}
        of={3}
        lead="Cada profesional tiene su propia agenda."
      >
        ¿Con quién te querés atender?
      </StepHeading>

      {practitioners.length === 0 ? (
        <div className="mt-10">
          <Notice tone="muted" title="Por ahora no hay turnos online">
            <p>
              {settings.phone
                ? `Llamanos al ${settings.phone} y lo vemos por teléfono.`
                : "Escribinos y lo vemos por teléfono."}
            </p>
          </Notice>
        </div>
      ) : (
        // `mt-6` y no más: el `py-6` de la primera fila completa los mismos
        // 51px que separan un profesional del siguiente.
        <div className="mt-6 space-y-10">
          {[...groups.entries()].map(([specialty, people]) => (
            <section key={specialty} aria-labelledby={`esp-${specialty}`}>
              {showSpecialtyHeadings && (
                <h2
                  id={`esp-${specialty}`}
                  className="mb-3 font-narrow text-sm font-bold uppercase tracking-[0.12em] text-muted"
                >
                  {specialty}
                </h2>
              )}

              {/*
                Renglones de la hoja, no tarjetas sueltas: elegir con quién es
                una línea del formulario, y el renglón entero es el enlace.
              */}
              <ul className="border-b border-border">
                {people.map((practitioner) => (
                  <li key={practitioner.id} className="border-t border-border first:border-t-0">
                    <Link
                      href={`/turnos/${practitioner.slug}`}
                      className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-6 transition-colors hover:text-accent"
                    >
                      <span className="min-w-0">
                        <span className="block font-wide text-[length:clamp(1.4rem,5vw,1.9rem)] font-extrabold leading-tight tracking-[-0.02em]">
                          {practitionerName(practitioner)}
                        </span>
                        <span className="mt-1 block text-muted">
                          {practitioner.title && `${practitioner.title} · `}
                          Turnos de {practitioner.slot_minutes} minutos
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 border-2 border-accent px-5 py-3 font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-white"
                      >
                        Ver horarios
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Counter>
  );
}
