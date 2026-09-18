import type { Metadata } from "next";

import { toggleSpecialty } from "@/app/actions/practitioners";
import { ConfirmAction, InlineAction } from "@/components/admin/buttons";
import { PageHeading, SectionHeading } from "@/components/admin/page-heading";
import { InactiveList, InactiveRow, RecordList, RecordRow } from "@/components/admin/record-row";
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

  const active = specialties.filter((specialty) => specialty.active);
  const inactive = specialties.filter((specialty) => !specialty.active);

  function professionals(specialtyId: string) {
    const count = countBySpecialty.get(specialtyId) ?? 0;
    return count === 0 ? "Sin profesionales" : `${count} ${count === 1 ? "profesional" : "profesionales"}`;
  }

  return (
    <div>
      <PageHeading title="Especialidades" />

      {active.length === 0 ? (
        <div className="mb-6">
          <Notice
            tone="muted"
            title={specialties.length === 0 ? "Todavía no hay ninguna" : "No hay especialidades activas"}
          >
            Cargá una acá abajo. Sin especialidad no se puede agregar un profesional.
          </Notice>
        </div>
      ) : (
        <RecordList>
          {active.map((specialty) => (
            <RecordRow
              key={specialty.id}
              title={specialty.name}
              meta={<span className="tabular-nums">{professionals(specialty.id)}</span>}
              action={
                <ConfirmAction
                  action={toggleSpecialty}
                  fields={{ id: specialty.id, active: "true" }}
                  label="Dar de baja"
                  question="¿Dejar de ofrecerla? Sus tratamientos salen de la página."
                  confirmLabel="Sí, dar de baja"
                  success={`Especialidad ${specialty.name}, de baja.`}
                />
              }
            />
          ))}
        </RecordList>
      )}

      <InactiveList label="De baja" count={inactive.length}>
        {inactive.map((specialty) => (
          <InactiveRow
            key={specialty.id}
            title={specialty.name}
            meta={<span className="tabular-nums">{professionals(specialty.id)}</span>}
            action={
              <InlineAction
                action={toggleSpecialty}
                fields={{ id: specialty.id, active: "false" }}
                success={`Especialidad ${specialty.name}, activa otra vez.`}
              >
                Volver a activar
              </InlineAction>
            }
          />
        ))}
      </InactiveList>

      <section className="mt-14 border-t-2 border-foreground pt-6">
        <SectionHeading>Agregar especialidad</SectionHeading>
        <div className="mt-5">
          <NewSpecialtyForm />
        </div>
      </section>
    </div>
  );
}
