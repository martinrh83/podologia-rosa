import type { Metadata } from "next";

import { toggleService, updateService } from "@/app/actions/schedule";
import { requireStaff } from "@/lib/auth";
import type { Service } from "@/lib/db/types";
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
 */
export default async function AdminServiciosPage() {
  await requireStaff();

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("services").select("*").order("display_order");
  const services = (data ?? []) as Service[];

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">Servicios y precios</h2>
      <p className="mt-1 text-muted">
        Los cambios se ven en el sitio al instante. Dejá el precio vacío para mostrar
        &laquo;Consultar&raquo;.
      </p>

      <ul className="mt-6 space-y-3">
        {services.map((service) => (
          <li
            key={service.id}
            className={`rounded-xl border border-border bg-surface p-4 ${
              service.active ? "" : "opacity-60"
            }`}
          >
            <form action={updateService} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={service.id} />

              <div className="grow">
                <label htmlFor={`name-${service.id}`} className="block text-sm font-medium">
                  Nombre
                </label>
                <input
                  id={`name-${service.id}`}
                  name="name"
                  defaultValue={service.name}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
                />
              </div>

              <div>
                <label htmlFor={`price-${service.id}`} className="block text-sm font-medium">
                  Precio
                </label>
                <input
                  id={`price-${service.id}`}
                  name="price"
                  type="number"
                  min="0"
                  step="100"
                  inputMode="numeric"
                  defaultValue={service.price ?? ""}
                  className="mt-1 w-32 rounded-lg border border-border bg-background px-3 py-2.5 tabular-nums"
                />
              </div>

              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover"
              >
                Guardar
              </button>
            </form>

            <form action={toggleService} className="mt-2">
              <input type="hidden" name="id" value={service.id} />
              <input type="hidden" name="active" value={String(service.active)} />
              <button type="submit" className="text-sm text-muted hover:text-foreground">
                {service.active ? "Ocultar del sitio" : "Mostrar en el sitio"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
