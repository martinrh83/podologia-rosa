import Link from "next/link";

import { Directions, type ScheduleRow } from "@/components/home/directions";
import { Faq } from "@/components/home/faq";
import { Team } from "@/components/home/team";
import { Treatments } from "@/components/home/treatments";
import { getClinicSettings } from "@/lib/availability";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  const supabase = createSupabaseAdminClient();
  const [settings, services, practitioners, locations, schedule] = await Promise.all([
    getClinicSettings(),
    getActiveServices(),
    listActivePractitioners(),
    listActiveLocations(),
    // Los horarios que se muestran en "Cómo llegar" salen de la agenda real.
    supabase
      .from("weekly_schedule")
      .select("weekday, start_time, end_time, location_id")
      .then(({ data }) => (data ?? []) as ScheduleRow[]),
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

      <Treatments services={services} />
      <Team practitioners={practitioners} />
      <Directions settings={settings} locations={locations} schedule={schedule} />
      <Faq />
    </>
  );
}
