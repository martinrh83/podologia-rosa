import type { Metadata } from "next";

import { toggleService } from "@/app/actions/schedule";
import { ConfirmAction, InlineAction } from "@/components/admin/buttons";
import { EditServiceForm } from "@/components/admin/edit-forms";
import { PageHeading, SectionHeading } from "@/components/admin/page-heading";
import { RecordList, RecordRow } from "@/components/admin/record-row";
import { requireStaff } from "@/lib/auth";
import type { ServiceWithSpecialty } from "@/lib/db/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Servicios y precios",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Price editing.
 *
 * Prices live in the database precisely so this screen exists: with Argentine
 * inflation a hardcoded price list is wrong within two months, and Rosa should
 * not need a deploy — or you — to fix it.
 *
 * Los precios son de referencia interna y no se publican (PRODUCT.md): el sitio
 * muestra sólo el nombre de cada tratamiento. La bajada decía lo contrario
 * —que los cambios se veían al instante y que un precio vacío mostraba
 * «Consultar»— y eso ya no era cierto.
 */
export default async function AdminServiciosPage() {
  await requireStaff();

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("services")
    .select("*, specialty:specialties(name, display_order)")
    .order("display_order");
  const services = (data ?? []) as unknown as ServiceWithSpecialty[];

  // Igual que en la página pública: con una sola disciplina el título sobra,
  // con dos es lo único que evita una pila indistinta de precios.
  const groups = new Map<string, ServiceWithSpecialty[]>();
  for (const service of services) {
    const key = service.specialty?.name ?? "Sin especialidad";
    groups.set(key, [...(groups.get(key) ?? []), service]);
  }
  const showHeadings = groups.size > 1;

  return (
    <div>
      <PageHeading title="Servicios y precios">
        Los precios son de referencia para el consultorio: no se publican, se informan en la
        consulta. El nombre sí aparece en Tratamientos, en la página.
      </PageHeading>

      <div className="space-y-12">
        {[...groups.entries()].map(([specialty, items]) => (
          <section key={specialty}>
            {showHeadings && (
              <div className="mb-4">
                <SectionHeading>{specialty}</SectionHeading>
              </div>
            )}

            <RecordList>
              {items.map((service) => {
                const fields = { id: service.id, active: String(service.active) };

                return (
                  <RecordRow
                    key={service.id}
                    title={service.name}
                    heading={showHeadings ? "h3" : "h2"}
                    inactive={service.active ? undefined : "Oculto: no aparece en la página"}
                    action={
                      service.active ? (
                        <ConfirmAction
                          action={toggleService}
                          fields={fields}
                          label="Ocultar de la página"
                          question="¿Sacarlo de Tratamientos?"
                          confirmLabel="Sí, ocultar"
                        />
                      ) : (
                        <InlineAction action={toggleService} fields={fields}>
                          Mostrar en la página
                        </InlineAction>
                      )
                    }
                  >
                    <EditServiceForm service={service} />
                  </RecordRow>
                );
              })}
            </RecordList>
          </section>
        ))}
      </div>
    </div>
  );
}
