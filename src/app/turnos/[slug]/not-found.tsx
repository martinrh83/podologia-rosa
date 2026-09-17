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
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="font-wide text-[length:clamp(1.75rem,6vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">
        Esa agenda ya no está disponible
      </h1>

      <p className="mt-4 max-w-[52ch] text-[1.15rem] leading-relaxed text-muted">
        Puede que quien buscabas ya no atienda en el consultorio, o que el enlace esté viejo.
      </p>

      {practitioners.length > 0 ? (
        <>
          <h2 className="mb-3 mt-12 font-narrow text-sm font-bold uppercase tracking-[0.12em] text-muted">
            Quiénes atienden ahora
          </h2>

          <ul className="border-b border-border">
            {practitioners.map((practitioner) => (
              <li key={practitioner.id} className="border-t border-border first:border-t-0">
                <Link
                  href={`/turnos/${practitioner.slug}`}
                  className="group flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-6 transition-colors hover:text-accent"
                >
                  <span className="min-w-0">
                    <span className="block font-wide text-[length:clamp(1.4rem,5vw,1.9rem)] font-extrabold leading-tight tracking-[-0.02em]">
                      {practitionerName(practitioner)}
                    </span>
                    {practitioner.title && (
                      <span className="mt-1 block text-muted">{practitioner.title}</span>
                    )}
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
        </>
      ) : (
        <div className="mt-10 border-2 border-border bg-surface-muted p-5">
          <p className="text-[1.15rem] font-bold">Por ahora no hay turnos online</p>
          <p className="mt-1.5 text-muted">Escribinos y lo vemos por teléfono.</p>
        </div>
      )}
    </div>
  );
}
