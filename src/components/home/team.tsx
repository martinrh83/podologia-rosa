import Link from "next/link";

import { practitionerName } from "@/lib/db/practitioners";
import type { PractitionerWithSpecialty } from "@/lib/db/types";

/**
 * Quién atiende.
 *
 * Era `/equipo`, una página propia. Con una sola profesional eran un nombre, un
 * título y una bio —media pantalla— y además se superponía con `/turnos`, que
 * ya las lista para elegir. Como sección del home no sobra nada.
 *
 * Si algún día atienden tres o cuatro, con biografías largas, vuelve a merecer
 * su URL: ahí una búsqueda por nombre propio tiene adónde caer.
 *
 * Las biografías salen de `practitioners.bio`, que cada una edita desde el
 * panel.
 */
export function Team({ practitioners }: { practitioners: PractitionerWithSpecialty[] }) {
  if (practitioners.length === 0) return null;

  return (
    <section id="team" className="scroll-mt-20">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">Profesionales</h2>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Atendemos de a una persona por vez, sin apuro y con el tiempo suficiente para
          explicarte qué está pasando.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {practitioners.map((practitioner) => (
            <li
              key={practitioner.id}
              className="flex flex-col rounded-xl border border-border bg-surface p-5"
            >
              <h3 className="text-xl font-medium">{practitionerName(practitioner)}</h3>
              <p className="mt-0.5 text-[0.95rem] text-muted">
                {practitioner.title ?? practitioner.specialty?.name}
              </p>

              {practitioner.bio && (
                <p className="mt-3 leading-relaxed text-muted">{practitioner.bio}</p>
              )}

              <Link
                href={`/turnos/${practitioner.slug}`}
                className="mt-4 inline-block self-start rounded-lg border border-accent px-4 py-2.5 font-medium text-accent hover:bg-accent hover:text-white"
              >
                Sacar turno con {practitioner.first_name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
