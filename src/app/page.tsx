import Link from "next/link";

import { getClinicSettings } from "@/lib/availability";
import { listActiveLocations } from "@/lib/db/locations";
import { listActivePractitioners, practitionerName } from "@/lib/db/practitioners";
import { getActiveServices } from "@/lib/db/services";
import { siteUrl } from "@/lib/env";
import { whatsappLink } from "@/lib/format";

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

export default async function HomePage() {
  const [settings, services, practitioners, locations] = await Promise.all([
    getClinicSettings(),
    getActiveServices(),
    listActivePractitioners(),
    listActiveLocations(),
  ]);

  /**
   * LocalBusiness structured data. This is how Rosa turns up for
   * "podóloga <ciudad>" — the main reason the site is server-rendered at all.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: settings.clinic_name,
    medicalSpecialty: "Podiatric",
    // Con una sede va `address`; con varias, cada una es un `location`. Es lo
    // que hace que Google pueda mostrar la más cercana al que busca.
    ...(locations.length === 1 && {
      address: { "@type": "PostalAddress", streetAddress: locations[0].address },
    }),
    ...(locations.length > 1 && {
      location: locations.map((row) => ({
        "@type": "Place",
        name: row.name,
        address: { "@type": "PostalAddress", streetAddress: row.address },
      })),
    }),
    ...(settings.phone && { telephone: settings.phone }),
    areaServed: "AR",
    // Cada profesional, con su propia agenda como URL. Es lo que permite que
    // una búsqueda por nombre propio caiga en la página donde se le saca turno.
    ...(practitioners.length > 0 && {
      employee: practitioners.map((practitioner) => ({
        "@type": "Person",
        name: practitionerName(practitioner),
        ...(practitioner.title && { jobTitle: practitioner.title }),
        url: `${siteUrl()}/turnos/${practitioner.slug}`,
      })),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Cuidamos tus pies,
          <br />
          <span className="text-accent">sin vueltas.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Consultorio de podología. Sacá tu turno online en menos de un minuto: sin llamar, sin
          esperar, y sin crear ninguna cuenta.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/turnos"
            className="rounded-lg bg-accent px-6 py-3.5 text-[1.05rem] font-medium text-white hover:bg-accent-hover"
          >
            Sacar un turno
          </Link>
          {settings.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="rounded-lg border border-border bg-surface px-6 py-3.5 text-[1.05rem] hover:border-accent"
            >
              Llamar al consultorio
            </a>
          )}
          {settings.whatsapp && (
            <a
              href={whatsappLink(
                settings.whatsapp,
                `Hola! Quería consultar por un turno en ${settings.clinic_name}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border bg-surface px-6 py-3.5 text-[1.05rem] hover:border-accent"
            >
              WhatsApp
            </a>
          )}
        </div>
      </section>

      {/*
        Tratamientos, sin precios.
        
        Los precios no se publican: en el panel siguen estando, como referencia
        interna, pero al paciente se le dice en la consulta. Eso también evita
        que un número quede desactualizado a la vista con la inflación.

        La sección entera desaparece si no hay tratamientos cargados. Un bloque
        con el título y nada abajo se lee peor que no tenerlo, y el home fluye
        igual sin él — que es exactamente el estado en que quedó producción
        cuando 0016 borró el catálogo de ejemplo.
      */}
      {services.length > 0 && (
        <section id="tratamientos" className="border-y border-border bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-12">
            <h2 className="text-2xl font-semibold tracking-tight">Tratamientos</h2>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="rounded-xl border border-border bg-background p-5"
                >
                  <p className="text-[1.05rem] font-medium">{service.name}</p>
                  {service.description && (
                    <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">
                      {service.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm text-muted">
              ¿No sabés cuál te corresponde? Sacá turno igual y lo vemos juntas. La
              duración depende de con quién te atiendas; la ves al elegir profesional.
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Cómo funciona</h2>
        <ol className="mt-5 space-y-3 text-[1.05rem]">
          <li className="flex gap-3">
            <span className="font-semibold text-accent">1.</span>
            Elegís el día y el horario que te queden cómodos.
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-accent">2.</span>
            Dejás tu nombre y un teléfono. Nada más.
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-accent">3.</span>
            Te llega la confirmación y, si no podés venir, cancelás con un clic.
          </li>
        </ol>
      </section>
    </>
  );
}
