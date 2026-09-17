import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/home/section-heading";
import { Stamp } from "@/components/stamp";
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
 * LA FOTO CARNET Y EL SELLO
 *
 *   Cada profesional es su ficha: la foto carnet abrochada, sin sombra, y al lado su sello
 *   con nombre y título, que es como firma cualquier profesional de salud. El
 *   mismo módulo para todas, repetido igual, así ninguna pesa más que otra.
 *
 *   El sello es HTML: el nombre adentro es el h3 de la ficha, no un dibujo.
 *
 *   Dos columnas desde `sm`, como Tratamientos y Cómo llegar: el texto arranca
 *   en los mismos dos bordes en todo el home.
 *
 * Las biografías salen de `practitioners.bio`, que cada una edita desde el
 * panel. Las fotos, de `src/lib/team-photos.ts`.
 */
export function Team({ practitioners }: { practitioners: PractitionerWithSpecialty[] }) {
  if (practitioners.length === 0) return null;

  return (
    <section id="team" className="scroll-mt-7">
      <div aria-hidden className="perforado h-1.5" />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <SectionHeading lead="Atendemos de a una persona por vez, sin apuro y con el tiempo suficiente para explicarte qué está pasando.">
          Profesionales
        </SectionHeading>

        <ul className="mt-12 grid gap-14 sm:grid-cols-2 sm:gap-x-10 lg:gap-x-12">
          {practitioners.map((practitioner) => {
            const name = practitionerName(practitioner);
            const title = practitioner.title ?? practitioner.specialty?.name;
            const photo = photoForPractitioner(practitioner.slug);
            return (
              // Columna flexible con el botón empujado al fondo: con y sin
              // biografía, los botones de las dos quedan a la misma altura.
              <li key={practitioner.id} className="flex flex-col">
                <div className="flex items-center gap-5 sm:gap-6">
                  <div className="relative w-[5.5rem] shrink-0 pt-2 min-[400px]:w-[6.5rem] lg:w-[8rem]">
                    <div className="relative aspect-[4/5] -rotate-2 overflow-hidden border-[5px] border-surface bg-surface-muted outline outline-1 outline-border">
                      <Image
                        src={photo.src}
                        // La silueta no le dice nada a quien no la ve: el nombre está al lado.
                        alt={photo.isPlaceholder ? "" : `Foto de ${name}`}
                        fill
                        sizes="(min-width: 1024px) 8rem, 6.5rem"
                        className="object-cover"
                      />
                    </div>
                    <Staple />
                  </div>

                  <div className="min-w-0 flex-1">
                    <Stamp tilt={-4}>
                      <h3 className="text-[length:clamp(1.05rem,4.6vw,1.3rem)] font-black tracking-[0.03em] sm:text-[1.1rem] lg:text-[1.45rem]">
                        {name}
                      </h3>
                      {title && <p className="mt-0.5 text-[0.8rem] font-bold tracking-[0.16em]">{title}</p>}
                    </Stamp>
                  </div>
                </div>

                {practitioner.bio && <p className="mt-6 max-w-[52ch] leading-relaxed">{practitioner.bio}</p>}
                <div className="mt-auto pt-6">
                  <Link
                    href={`/turnos/${practitioner.slug}`}
                    className="inline-block border-2 border-accent px-5 py-3 font-bold text-accent transition-[background-color,color,transform] duration-100 hover:bg-accent hover:text-white active:translate-y-0.5 active:scale-[0.985]"
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

/** El broche: una marca plana de tinta gris cruzando el borde de arriba de la foto. */
function Staple() {
  return (
    <svg aria-hidden viewBox="0 0 44 12" className="absolute left-1/2 top-0 w-11 -translate-x-1/2 rotate-[4deg]">
      <path d="M3 10V4h38v6" fill="none" stroke="#6b7684" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
