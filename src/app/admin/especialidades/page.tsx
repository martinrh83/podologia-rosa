import type { Metadata } from "next";

import { toggleSpecialty } from "@/app/actions/practitioners";
import { ConfirmAction, InlineAction } from "@/components/admin/buttons";
import { PageHeading, SectionHeading } from "@/components/admin/page-heading";
import { RecordList, RecordRow } from "@/components/admin/record-row";
import { Notice } from "@/components/notice";
import { NewSpecialtyForm } from "@/components/practitioner-admin";
import { requireStaff } from "@/lib/auth";
import { listAllPractitioners, listSpecialties } from "@/lib/db/practitioners";

export const metadata: Metadata = {
  title: "Especialidades",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Las disciplinas del consultorio.
 *
 * Es una tabla y no un texto libre en cada profesional porque agrupa: la página
 * de turnos y la de precios ordenan por especialidad, y con texto suelto un
 * "Podologia" sin tilde cargado un martes crea un grupo nuevo.
 */
export default async function AdminEspecialidadesPage() {
  await requireStaff();

  const [specialties, practitioners] = await Promise.all([
    listSpecialties(),
    listAllPractitioners(),
  ]);

  const countBySpecialty = new Map<string, number>();
  for (const practitioner of practitioners) {
    countBySpecialty.set(
      practitioner.specialty_id,
      (countBySpecialty.get(practitioner.specialty_id) ?? 0) + 1,
    );
  }

  return (
    <div>
      <PageHeading title="Especialidades">
        Las disciplinas que se atienden. Agrupan a los profesionales y a los precios.
      </PageHeading>

      {specialties.length === 0 ? (
        <Notice tone="muted" title="Todavía no hay ninguna">
          Cargá la primera acá abajo. Sin especialidad no se puede agregar un profesional.
        </Notice>
      ) : (
        <RecordList>
          {specialties.map((specialty) => {
            const count = countBySpecialty.get(specialty.id) ?? 0;
            const fields = { id: specialty.id, active: String(specialty.active) };

            return (
              <RecordRow
                key={specialty.id}
                title={specialty.name}
                inactive={specialty.active ? undefined : "De baja: no se ofrece"}
                meta={
                  <span className="tabular-nums">
                    {count === 0
                      ? "Sin profesionales"
                      : `${count} ${count === 1 ? "profesional" : "profesionales"}`}
                  </span>
                }
                action={
                  specialty.active ? (
                    <ConfirmAction
                      action={toggleSpecialty}
                      fields={fields}
                      label="Dar de baja"
                      question="¿Dejar de ofrecerla? Sus tratamientos salen de la página."
                      confirmLabel="Sí, dar de baja"
                    />
                  ) : (
                    <InlineAction action={toggleSpecialty} fields={fields}>
                      Volver a activar
                    </InlineAction>
                  )
                }
              />
            );
          })}
        </RecordList>
      )}

      <section className="mt-14 border-t-2 border-foreground pt-6">
        <SectionHeading>Agregar especialidad</SectionHeading>
        <div className="mt-5">
          <NewSpecialtyForm />
        </div>
      </section>
    </div>
  );
}
