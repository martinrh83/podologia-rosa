import type { Metadata } from "next";

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
      <h2 className="text-2xl font-semibold tracking-tight">Especialidades</h2>
      <p className="mt-1 text-muted">
        Las disciplinas que se atienden. Agrupan a los profesionales y a los precios.
      </p>

      <ul className="mt-6 space-y-2">
        {specialties.map((specialty) => {
          const count = countBySpecialty.get(specialty.id) ?? 0;
          return (
            <li
              key={specialty.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <strong>{specialty.name}</strong>
              <span className="text-sm text-muted">
                {count === 0
                  ? "sin profesionales"
                  : `${count} ${count === 1 ? "profesional" : "profesionales"}`}
              </span>
            </li>
          );
        })}
        {specialties.length === 0 && (
          <li className="rounded-lg border border-border bg-surface-muted p-4 text-muted">
            Todavía no hay ninguna.
          </li>
        )}
      </ul>

      <NewSpecialtyForm />
    </div>
  );
}
