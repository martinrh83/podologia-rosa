import type { Metadata } from "next";
import Link from "next/link";

import { getClinicSettings } from "@/lib/availability";
import { listActivePractitioners, practitionerName } from "@/lib/db/practitioners";
import type { PractitionerWithSpecialty } from "@/lib/db/types";

export const metadata: Metadata = {
  title: "Sacar un turno",
  description:
    "Elegí con quién te querés atender y mirá sus horarios disponibles. No hace falta crear una cuenta ni llamar por teléfono.",
};

// La lista cambia poco, pero dar de baja a alguien tiene que sacarlo de acá en
// el momento: un turno reservado con quien ya no atiende no lo arregla nadie.
export const dynamic = "force-dynamic";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sacar un turno</h1>
        <p className="mt-3 text-lg text-muted">
          Elegí con quién te querés atender y te mostramos sus horarios libres.
        </p>
      </header>

      {practitioners.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-muted p-5">
          <p className="font-medium">Por ahora no hay turnos online</p>
          <p className="mt-1 text-[0.95rem] text-muted">
            {settings.phone
              ? `Llamanos al ${settings.phone} y lo vemos por teléfono.`
              : "Escribinos y lo vemos por teléfono."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([specialty, people]) => (
            <section key={specialty} aria-labelledby={`esp-${specialty}`}>
              {showSpecialtyHeadings && (
                <h2
                  id={`esp-${specialty}`}
                  className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted"
                >
                  {specialty}
                </h2>
              )}

              <ul className="space-y-3">
                {people.map((practitioner) => (
                  <li key={practitioner.id}>
                    <Link
                      href={`/turnos/${practitioner.slug}`}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
                    >
                      <span>
                        <span className="block text-[1.15rem] font-medium">
                          {practitionerName(practitioner)}
                        </span>
                        {practitioner.title && (
                          <span className="mt-0.5 block text-[0.95rem] text-muted">
                            {practitioner.title}
                          </span>
                        )}
                        <span className="mt-1 block text-sm text-muted">
                          Turnos de {practitioner.slot_minutes} minutos
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 rounded-lg bg-accent px-4 py-2.5 font-medium text-white"
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
    </div>
  );
}
