import type { Metadata } from "next";

import { togglePractitioner } from "@/app/actions/practitioners";
import { ConfirmAction, InlineAction } from "@/components/admin/buttons";
import { EditPractitionerForm } from "@/components/admin/edit-forms";
import { PageHeading, SectionHeading } from "@/components/admin/page-heading";
import { RecordList, RecordRow } from "@/components/admin/record-row";
import { NewPractitionerForm } from "@/components/practitioner-admin";
import { requireStaff } from "@/lib/auth";
import { listActiveSpecialties, listAllPractitioners } from "@/lib/db/practitioners";

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

  return (
    <div>
      <PageHeading title="Profesionales" />

      <RecordList>
        {practitioners.map((practitioner) => {
          const name = `${practitioner.first_name} ${practitioner.last_name}`;
          const fields = { id: practitioner.id, active: String(practitioner.active) };

          return (
            <RecordRow
              key={practitioner.id}
              title={name}
              inactive={practitioner.active ? undefined : "De baja: no aparece en el sitio"}
              meta={
                <>
                  {practitioner.specialty?.name}
                  {" · "}
                  <span className="tabular-nums">/turnos/{practitioner.slug}</span>
                </>
              }
              // Nunca se borra: los turnos pasados apuntan a esta fila. Inactivo
              // sale del sitio y de la agenda, y el historial queda entero.
              action={
                practitioner.active ? (
                  <ConfirmAction
                    action={togglePractitioner}
                    fields={fields}
                    label="Dar de baja"
                    question={`¿Sacar a ${practitioner.first_name} del sitio?`}
                    confirmLabel="Sí, dar de baja"
                  />
                ) : (
                  <InlineAction action={togglePractitioner} fields={fields}>
                    Volver a activar
                  </InlineAction>
                )
              }
            >
              <EditPractitionerForm practitioner={practitioner} />
            </RecordRow>
          );
        })}
      </RecordList>

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
