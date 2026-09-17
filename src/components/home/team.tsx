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
 * RETRATO Y TEXTO, NO TARJETAS
 *
 *   Tratamientos y Cómo llegar ya son grillas de tarjetas; una tercera ponía a
 *   las profesionales al mismo nivel que un servicio. Acá lo que da confianza
 *   antes de una consulta de salud es ver a la persona, así que cada una tiene
 *   su retrato, sin caja alrededor.
 *
 * LAS MISMAS DOS COLUMNAS QUE CÓMO LLEGAR
 *
 *   Fueron filas a todo el ancho con el retrato a la izquierda, y el texto
 *   quedaba corrido 210 px: arrancaba en un borde que no usa ninguna otra
 *   sección y, con la bio limitada a un largo de línea razonable, terminaba a
 *   mitad de la sección. Ahora cada profesional va en una columna de
 *   `sm:grid-cols-2 gap-6`, igual que las sedes: el texto arranca en los mismos
 *   dos bordes y la columna ya da ~65 caracteres por línea, sin un ancho
 *   máximo artificial. Con tres o más, pasan a otra fila de a dos.
 *
 *   Dentro de la columna, el retrato va chico al lado del nombre, y la bio y el
 *   botón debajo, desde el borde de la columna. Es el mismo esquema en el
 *   teléfono y en escritorio.
 *
 *   El nombre va a 22 px en negrita, claramente por debajo de "Profesionales"
 *   (25,5 px): a 32 px y 800 le ganaba al título de la sección y la jerarquía
 *   quedaba al revés. Sigue pesando más que el nombre de una sede (19 px).
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

        {/*
          En el teléfono, una debajo de otra con una línea entre las dos; en dos
          columnas, la línea de arriba de la lista alcanza.
        */}
        <ul className="mt-8 grid gap-6 border-t border-border pt-8 sm:grid-cols-2 sm:gap-y-10">
          {practitioners.map((practitioner) => {
            const name = practitionerName(practitioner);
            const photo = photoForPractitioner(practitioner.slug);
            return (
              <li
                key={practitioner.id}
                className="grid grid-cols-[6.5rem_minmax(0,1fr)] content-start gap-x-5 gap-y-5 max-sm:not-first:border-t max-sm:not-first:border-border max-sm:not-first:pt-8 sm:grid-cols-[7.5rem_minmax(0,1fr)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
                  <Image
                    src={photo.src}
                    // La silueta no le dice nada a quien no la ve: el nombre está al lado.
                    alt={photo.isPlaceholder ? "" : `Foto de ${name}`}
                    fill
                    sizes="(min-width: 640px) 7.5rem, 6.5rem"
                    className="object-cover"
                  />
                </div>

                <div className="self-center">
                  <h3 className="text-[1.2rem] font-bold leading-tight tracking-tight sm:text-[1.3rem]">
                    {name}
                  </h3>
                  <p className="mt-1 text-muted">
                    {practitioner.title ?? practitioner.specialty?.name}
                  </p>
                </div>

                <div className="col-span-2">
                  {practitioner.bio && <p className="leading-relaxed">{practitioner.bio}</p>}
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
