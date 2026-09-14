import Link from "next/link";

import { listActivePractitioners, practitionerName } from "@/lib/db/practitioners";

/**
 * Cuando el slug no corresponde a nadie que atienda hoy.
 *
 * El caso real no es una URL mal tipeada: es el link que quedó en un WhatsApp
 * de hace meses, de alguien que ya no trabaja acá. `getPractitionerBySlug`
 * filtra por `active` para que ese link deje de tomar turnos — pero dejar al
 * paciente en un 404 genérico lo pierde igual que si el turno se hubiera
 * reservado mal.
 *
 * Por eso acá sí se consulta la base: el que llegó quería sacar un turno, y lo
 * único que le falta es saber con quién puede.
 */
export default async function AgendaNoDisponible() {
  const practitioners = await listActivePractitioners();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Esa agenda ya no está disponible
      </h1>

      <p className="mt-3 text-lg text-muted">
        Puede que quien buscabas ya no atienda en el consultorio, o que el enlace esté viejo.
      </p>

      {practitioners.length > 0 ? (
        <>
          <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Quiénes atienden ahora
          </h2>

          <ul className="space-y-3">
            {practitioners.map((practitioner) => (
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
                  </span>
                  <span className="text-[0.95rem] font-medium text-accent">Ver horarios</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-surface-muted p-5">
          <p className="font-medium">Por ahora no hay turnos online</p>
          <p className="mt-1 text-[0.95rem] text-muted">Escribinos y lo vemos por teléfono.</p>
        </div>
      )}
    </div>
  );
}
