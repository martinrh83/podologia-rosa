import Image from "next/image";
import Link from "next/link";

import { practitionerName } from "@/lib/db/practitioners";
import type { PractitionerWithSpecialty } from "@/lib/db/types";
import { photoForPractitioner } from "@/lib/team-photos";

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
 * FILAS CON RETRATO, NO TARJETAS
 *
 *   Tratamientos y Cómo llegar ya son grillas de tarjetas; una tercera ponía a
 *   las profesionales al mismo nivel que un servicio. Acá lo que da confianza
 *   antes de una consulta de salud es ver a la persona, así que cada una es una
 *   fila con su retrato y su nombre en el negro fuerte del hero.
 *
 *   El nombre queda por debajo del título de la sección en tamaño: en el mockup
 *   original le ganaba, y la jerarquía quedaba al revés.
 *
 *   En el teléfono el retrato va chico al lado del nombre, y la bio y el botón
 *   debajo, a todo el ancho: apilado a tamaño completo, cada persona ocupaba una
 *   pantalla entera.
 *
 * Las biografías salen de `practitioners.bio`, que cada una edita desde el
 * panel. Las fotos, de `src/lib/team-photos.ts`.
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

        <ul className="mt-8 divide-y divide-border border-t border-border">
          {practitioners.map((practitioner) => {
            const name = practitionerName(practitioner);
            const photo = photoForPractitioner(practitioner.slug);
            return (
              <li
                key={practitioner.id}
                className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-5 gap-y-5 py-8 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-x-10"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted sm:row-span-2">
                  <Image
                    src={photo.src}
                    // La silueta no le dice nada a quien no la ve: el nombre está al lado.
                    alt={photo.isPlaceholder ? "" : `Foto de ${name}`}
                    fill
                    sizes="(min-width: 640px) 13rem, 6.5rem"
                    className="object-cover"
                  />
                </div>

                <div className="self-center sm:self-end">
                  <h3 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] sm:text-[1.9rem]">
                    {name}
                  </h3>
                  <p className="mt-1 text-muted">
                    {practitioner.title ?? practitioner.specialty?.name}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 sm:col-start-2">
                  {practitioner.bio && (
                    <p className="max-w-prose leading-relaxed">{practitioner.bio}</p>
                  )}
                  <Link
                    href={`/turnos/${practitioner.slug}`}
                    className={`inline-block rounded-lg border border-accent px-4 py-2.5 font-medium text-accent hover:bg-accent hover:text-white ${practitioner.bio ? "mt-5" : ""}`}
                  >
                    Sacar turno con {practitioner.first_name}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
