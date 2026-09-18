import type { Metadata } from "next";

import { toggleLocation } from "@/app/actions/locations";
import { ConfirmAction, InlineAction } from "@/components/admin/buttons";
import { EditLocationForm } from "@/components/admin/edit-forms";
import { PageHeading, SectionHeading } from "@/components/admin/page-heading";
import { RecordList, RecordRow } from "@/components/admin/record-row";
import { NewLocationForm } from "@/components/location-form";
import { requireStaff } from "@/lib/auth";
import { listAllLocations } from "@/lib/db/locations";

export const metadata: Metadata = {
  title: "Sedes",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Dónde se atiende.
 *
 * La dirección y el mapa vivían en «Consultorio» cuando había una sola. Desde
 * que hay dos, cada una tiene su ficha y el horario dice a cuál pertenece.
 */
export default async function AdminSedesPage() {
  await requireStaff();

  const locations = await listAllLocations();

  return (
    <div>
      <PageHeading title="Sedes">
        Cada franja horaria pertenece a una sede, y el turno guarda dónde fue.
      </PageHeading>

      <RecordList>
        {locations.map((location) => {
          const fields = { id: location.id, active: String(location.active) };

          return (
            <RecordRow
              key={location.id}
              title={location.name}
              inactive={location.active ? undefined : "Dada de baja: no aparece en el sitio"}
              // Nunca se borra: los turnos que pasaron ahí la referencian.
              // Inactiva sale del sitio y de los formularios, y el historial
              // queda entero.
              action={
                location.active ? (
                  <ConfirmAction
                    action={toggleLocation}
                    fields={fields}
                    label="Dar de baja"
                    question={`¿Sacar la sede ${location.name} del sitio?`}
                    confirmLabel="Sí, dar de baja"
                  />
                ) : (
                  <InlineAction action={toggleLocation} fields={fields}>
                    Volver a activar
                  </InlineAction>
                )
              }
            >
              <EditLocationForm location={location} />
            </RecordRow>
          );
        })}
      </RecordList>

      <section className="mt-14 border-t-2 border-foreground pt-6">
        <SectionHeading>Agregar sede</SectionHeading>
        <div className="mt-5">
          <NewLocationForm />
        </div>
      </section>
    </div>
  );
}
