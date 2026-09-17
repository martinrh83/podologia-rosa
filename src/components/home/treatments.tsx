import type { ServiceWithSpecialty } from "@/lib/db/types";

/**
 * Los tratamientos, sin precios.
 *
 * Los precios siguen en la base y en el panel como referencia interna, pero no
 * se publican: se los dice Rosa en la consulta. Eso además evita que un número
 * quede desactualizado a la vista con la inflación.
 *
 * Devuelve null si no hay nada cargado. Un bloque con el título y nada abajo se
 * lee peor que no tenerlo, y el home fluye igual sin él.
 */
export function Treatments({ services }: { services: ServiceWithSpecialty[] }) {
  if (services.length === 0) return null;

  return (
    <section id="treatments" className="scroll-mt-20 border-y border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight">Tratamientos</h2>

        {/*
          Dos columnas y no tres: con cuatro tratamientos, tres dejaban uno suelto
          abajo. Además son las mismas columnas que Profesionales y Cómo llegar.
        */}
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {services.map((service) => (
            <li key={service.id} className="rounded-xl border border-border bg-background p-5">
              {/* h3 y 19 px semibold, como las sedes en Cómo llegar: a 17,9 px y 500 el nombre casi no se distinguía de la descripción. */}
              <h3 className="text-lg font-semibold tracking-tight">{service.name}</h3>
              {service.description && (
                <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">
                  {service.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
