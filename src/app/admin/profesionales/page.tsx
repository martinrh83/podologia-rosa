import type { Metadata } from "next";

import { movePractitioner, togglePractitioner } from "@/app/actions/practitioners";
import { ConfirmAction, InlineAction } from "@/components/admin/buttons";
import { EditPractitionerForm } from "@/components/admin/edit-forms";
import { PageHeading, SectionHeading } from "@/components/admin/page-heading";
import { InactiveList, InactiveRow, RecordList, RecordRow } from "@/components/admin/record-row";
import { Notice } from "@/components/notice";
import { NewPractitionerForm } from "@/components/practitioner-admin";
import { requireStaff } from "@/lib/auth";
import {
  listActiveSpecialties,
  listAllPractitioners,
  practitionerFirstName,
  practitionerName,
} from "@/lib/db/practitioners";

export const metadata: Metadata = {
  title: "Profesionales",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Alta y edición de quién atiende.
 *
 * Sumar a alguien al consultorio no debería ser un deploy, por el mismo motivo
 * que los precios y los horarios viven en la base: el día que entre la tercera,
 * el consultorio se arregla solo.
 */
export default async function AdminProfesionalesPage() {
  await requireStaff();

  const [practitioners, specialties] = await Promise.all([
    listAllPractitioners(),
    listActiveSpecialties(),
  ]);
  const active = practitioners.filter((practitioner) => practitioner.active);
  const inactive = practitioners.filter((practitioner) => !practitioner.active);

  return (
    <div>
      <PageHeading title="Profesionales" />

      {active.length === 0 ? (
        <div className="mb-6">
          <Notice tone="muted" title="No hay profesionales activos">
            Agregá uno acá abajo, o volvé a activar a alguien de la lista de baja.
          </Notice>
        </div>
      ) : (
        <RecordList>
          {active.map((practitioner, index) => (
            <RecordRow
              key={practitioner.id}
              title={practitionerName(practitioner)}
              meta={practitioner.specialty?.name}
              action={
                <div className="flex flex-col items-end gap-y-1">
                  {/*
                    El orden de esta lista es el que se ve en el sitio y en toda
                    la agenda. Se mueve de a un lugar: son dos o tres personas,
                    y un renglón que sube o baja se sigue con la vista. La
                    primera no tiene "Subir" ni la última "Bajar", así el botón
                    que está nunca no hace nada.
                  */}
                  {active.length > 1 && (
                    <div className="flex items-center gap-x-4">
                      {index > 0 && (
                        <InlineAction
                          action={movePractitioner}
                          fields={{ id: practitioner.id, direction: "up" }}
                          success={
                            index === 1
                              ? `${practitionerName(practitioner)} va primera.`
                              : `${practitionerName(practitioner)} sube al lugar ${index}.`
                          }
                        >
                          Subir
                        </InlineAction>
                      )}
                      {index < active.length - 1 && (
                        <InlineAction
                          action={movePractitioner}
                          fields={{ id: practitioner.id, direction: "down" }}
                          success={`${practitionerName(practitioner)} baja al lugar ${index + 2}.`}
                        >
                          Bajar
                        </InlineAction>
                      )}
                    </div>
                  )}
                  <ConfirmAction
                    action={togglePractitioner}
                    fields={{ id: practitioner.id, active: "true" }}
                    label="Dar de baja"
                    question={`¿Sacar a ${practitionerFirstName(practitioner)} del sitio?`}
                    confirmLabel="Sí, dar de baja"
                    success={`${practitionerName(practitioner)}, de baja.`}
                  />
                </div>
              }
            >
              <EditPractitionerForm practitioner={practitioner} />
            </RecordRow>
          ))}
        </RecordList>
      )}

      {/*
        Nunca se borra: los turnos pasados apuntan a esta fila. De baja sale del
        sitio y de la agenda, el historial queda entero, y acá no estorba.
      */}
      <InactiveList label="De baja" count={inactive.length}>
        {inactive.map((practitioner) => (
          <InactiveRow
            key={practitioner.id}
            title={practitionerName(practitioner)}
            meta={practitioner.specialty?.name}
            action={
              <InlineAction
                action={togglePractitioner}
                fields={{ id: practitioner.id, active: "false" }}
                success={`${practitionerName(practitioner)} vuelve a aparecer en el sitio.`}
              >
                Volver a activar
              </InlineAction>
            }
          />
        ))}
      </InactiveList>

      <section className="mt-14 border-t-2 border-foreground pt-6">
        <SectionHeading>Agregar profesional</SectionHeading>
        <div className="mt-5">
          <NewPractitionerForm
            specialties={specialties.map((specialty) => ({ id: specialty.id, name: specialty.name }))}
          />
        </div>
      </section>
    </div>
  );
}
