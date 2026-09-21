import type { Metadata } from "next";

import { moveLocation, toggleLocation } from "@/app/actions/locations";
import { ConfirmAction, InlineAction } from "@/components/admin/buttons";
import { EditLocationForm } from "@/components/admin/edit-forms";
import { MoveButtons } from "@/components/admin/move-buttons";
import { PageHeading, SectionHeading } from "@/components/admin/page-heading";
import { InactiveList, InactiveRow, RecordList, RecordRow } from "@/components/admin/record-row";
import { Notice } from "@/components/notice";
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
  const active = locations.filter((location) => location.active);
  const inactive = locations.filter((location) => !location.active);

  return (
    <div>
      <PageHeading title="Sedes" />

      {active.length === 0 ? (
        <div className="mb-6">
          <Notice tone="muted" title="No hay sedes activas">
            Sin una sede no se pueden cargar horarios. Agregá una acá abajo, o volvé a activar una de
            la lista de baja.
          </Notice>
        </div>
      ) : (
        <RecordList>
          {active.map((location, index) => (
            <RecordRow
              key={location.id}
              title={location.name}
              action={
                <div className="flex flex-col items-end gap-y-1">
                  {/* La primera es la que se lee primero en Cómo llegar, en la tarjeta y en la agenda. */}
                  <MoveButtons
                    action={moveLocation}
                    id={location.id}
                    name={`Sede ${location.name}`}
                    index={index}
                    count={active.length}
                  />
                  <ConfirmAction
                    action={toggleLocation}
                    fields={{ id: location.id, active: "true" }}
                    label="Dar de baja"
                    question={`¿Sacar la sede ${location.name} del sitio?`}
                    confirmLabel="Sí, dar de baja"
                    success={`Sede ${location.name}, de baja.`}
                  />
                </div>
              }
            >
              <EditLocationForm location={location} />
            </RecordRow>
          ))}
        </RecordList>
      )}

      {/*
        Nunca se borra: los turnos que pasaron ahí la referencian. De baja sale
        del sitio y de los formularios, y el historial queda entero.
      */}
      <InactiveList label="De baja" count={inactive.length}>
        {inactive.map((location) => (
          <InactiveRow
            key={location.id}
            title={location.name}
            meta={location.address}
            action={
              <InlineAction
                action={toggleLocation}
                fields={{ id: location.id, active: "false" }}
                success={`Sede ${location.name}, activa otra vez.`}
              >
                Volver a activar
              </InlineAction>
            }
          />
        ))}
      </InactiveList>

      <section className="mt-14 border-t-2 border-foreground pt-6">
        <SectionHeading>Agregar sede</SectionHeading>
        <div className="mt-5">
          <NewLocationForm />
        </div>
      </section>
    </div>
  );
}
