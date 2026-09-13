import type { Metadata } from "next";
import Link from "next/link";

import { togglePractitioner, updatePractitioner } from "@/app/actions/practitioners";
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
      <h2 className="text-2xl font-semibold tracking-tight">Profesionales</h2>
      <p className="mt-1 text-muted">
        Quiénes aparecen al sacar un turno.{" "}
        <Link href="/admin/especialidades" className="text-accent underline">
          Las especialidades se cargan acá
        </Link>
        .
      </p>

      <ul className="mt-6 space-y-3">
        {practitioners.map((practitioner) => (
          <li
            key={practitioner.id}
            className={`rounded-xl border border-border bg-surface p-4 ${
              practitioner.active ? "" : "opacity-60"
            }`}
          >
            <p className="mb-3 text-sm text-muted">
              {practitioner.specialty?.name}
              {" · "}
              <span className="tabular-nums">/turnos/{practitioner.slug}</span>
              {!practitioner.active && " · no aparece en el sitio"}
            </p>

            <form action={updatePractitioner} className="space-y-3">
              <input type="hidden" name="id" value={practitioner.id} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`fn-${practitioner.id}`} className="block text-sm font-medium">
                    Nombre
                  </label>
                  <input
                    id={`fn-${practitioner.id}`}
                    name="firstName"
                    required
                    minLength={2}
                    defaultValue={practitioner.first_name}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  />
                </div>
                <div>
                  <label htmlFor={`ln-${practitioner.id}`} className="block text-sm font-medium">
                    Apellido
                  </label>
                  <input
                    id={`ln-${practitioner.id}`}
                    name="lastName"
                    required
                    minLength={2}
                    defaultValue={practitioner.last_name}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="grow">
                  <label htmlFor={`ti-${practitioner.id}`} className="block text-sm font-medium">
                    Título
                  </label>
                  <input
                    id={`ti-${practitioner.id}`}
                    name="title"
                    defaultValue={practitioner.title ?? ""}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  />
                </div>
                <div>
                  <label htmlFor={`sm-${practitioner.id}`} className="block text-sm font-medium">
                    Turno (min)
                  </label>
                  <input
                    id={`sm-${practitioner.id}`}
                    name="slotMinutes"
                    type="number"
                    required
                    min="5"
                    step="5"
                    inputMode="numeric"
                    defaultValue={practitioner.slot_minutes}
                    className="mt-1 w-28 rounded-lg border border-border bg-background px-3 py-2.5 tabular-nums"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover"
                >
                  Guardar
                </button>
              </div>
            </form>

            {/*
              Nunca se borra: los turnos pasados apuntan a esta fila. Inactivo
              sale del sitio y de la agenda, y el historial queda entero.
            */}
            <form action={togglePractitioner} className="mt-2">
              <input type="hidden" name="id" value={practitioner.id} />
              <input type="hidden" name="active" value={String(practitioner.active)} />
              <button type="submit" className="text-sm text-muted hover:text-foreground">
                {practitioner.active ? "Dar de baja" : "Volver a activar"}
              </button>
            </form>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-lg font-semibold tracking-tight">Agregar profesional</h3>
      <NewPractitionerForm
        specialties={specialties.map((specialty) => ({ id: specialty.id, name: specialty.name }))}
      />
    </div>
  );
}
