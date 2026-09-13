import type { Metadata } from "next";

import { toggleLocation, updateLocation } from "@/app/actions/locations";
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
      <h2 className="text-2xl font-semibold tracking-tight">Sedes</h2>
      <p className="mt-1 text-muted">
        Cada franja horaria pertenece a una sede, y el turno guarda dónde fue.
      </p>

      <ul className="mt-6 space-y-3">
        {locations.map((location) => (
          <li
            key={location.id}
            className={`rounded-xl border border-border bg-surface p-4 ${
              location.active ? "" : "opacity-60"
            }`}
          >
            {!location.active && (
              <p className="mb-2 text-sm text-muted">No aparece en el sitio</p>
            )}

            <form action={updateLocation} className="space-y-3">
              <input type="hidden" name="id" value={location.id} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`n-${location.id}`} className="block text-sm font-medium">
                    Nombre
                  </label>
                  <input
                    id={`n-${location.id}`}
                    name="name"
                    required
                    minLength={2}
                    defaultValue={location.name}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  />
                </div>
                <div>
                  <label htmlFor={`a-${location.id}`} className="block text-sm font-medium">
                    Dirección
                  </label>
                  <input
                    id={`a-${location.id}`}
                    name="address"
                    required
                    minLength={5}
                    defaultValue={location.address}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="grow">
                  <label htmlFor={`m-${location.id}`} className="block text-sm font-medium">
                    Enlace del mapa
                  </label>
                  <input
                    id={`m-${location.id}`}
                    name="mapUrl"
                    type="url"
                    defaultValue={location.map_url ?? ""}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
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
              Nunca se borra: los turnos que pasaron ahí la referencian. Inactiva
              sale del sitio y de los formularios, y el historial queda entero.
            */}
            <form action={toggleLocation} className="mt-2">
              <input type="hidden" name="id" value={location.id} />
              <input type="hidden" name="active" value={String(location.active)} />
              <button type="submit" className="text-sm text-muted hover:text-foreground">
                {location.active ? "Dar de baja" : "Volver a activar"}
              </button>
            </form>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-lg font-semibold tracking-tight">Agregar sede</h3>
      <NewLocationForm />
    </div>
  );
}
