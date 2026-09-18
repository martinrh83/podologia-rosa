"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { FIELD, Label, SELECT } from "@/components/admin/fields";

/** Cuánto se espera después de la última tecla antes de ir a buscar horarios. */
const DEBOUNCE_MS = 400;

type Option = { id: string; name: string };

type Props = {
  practitioners: Option[];
  practitionerId: string;
  dateKey: string;
};

/**
 * Profesional y fecha de «Nuevo turno».
 *
 * Navega solo al cambiar cualquiera de los dos. Antes había un botón «Ver
 * horarios» y la lista no se actualizaba hasta apretarlo: un paso de más en la
 * pantalla que se usa con el paciente esperando del otro lado del mostrador.
 *
 * Sigue siendo una navegación con la elección en la URL —se puede compartir, y
 * el botón de atrás funciona— sólo que ahora la dispara el `change` en vez de
 * un clic. `scroll: false` evita el salto al tope: lo que cambia está abajo.
 *
 * DOS CUIDADOS CON EL CAMPO DE FECHA, los dos por lo mismo: al tipear, una
 * fecha a medio escribir YA ES una fecha válida y dispara `change`.
 *
 *  - Va sin controlar (`defaultValue`). Controlado, la navegación del primer
 *    dígito volvía a pintar el campo y se comía el segundo: tipear «14» dejaba
 *    «04».
 *  - Y con una espera. Sin ella, escribir un día son dos viajes al servidor y
 *    el primero es a una fecha que nadie pidió.
 */
export function SlotFilters({ practitioners, practitionerId, dateKey }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // El campo no está controlado, así que hay que traerlo a mano cuando la fecha
  // cambia desde afuera: el botón de atrás. Tras una navegación propia el valor
  // ya coincide y esto no hace nada, que es lo que evita perder el foco.
  useEffect(() => {
    if (dateInput.current && dateInput.current.value !== dateKey) {
      dateInput.current.value = dateKey;
    }
  }, [dateKey]);

  function go(next: { profesional?: string; fecha?: string }) {
    const params = new URLSearchParams({
      profesional: next.profesional ?? practitionerId,
      fecha: next.fecha ?? dateKey,
    });

    startTransition(() => {
      router.push(`/admin/nuevo?${params}`, { scroll: false });
    });
  }

  return (
    <div className="mb-4 grid gap-x-4 gap-y-2 sm:grid-cols-2" aria-busy={isPending}>
      {practitioners.length > 1 && (
        <div>
          <Label htmlFor="profesional">Profesional</Label>
          <select
            id="profesional"
            value={practitionerId}
            onChange={(event) => go({ profesional: event.target.value })}
            className={`mt-2 ${SELECT}`}
          >
            {practitioners.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="max-sm:mt-2">
        <Label htmlFor="fecha">Fecha</Label>
        <input
          id="fecha"
          ref={dateInput}
          type="date"
          defaultValue={dateKey}
          onChange={(event) => {
            const value = event.target.value;
            if (timer.current) clearTimeout(timer.current);
            // Un campo vacío o a medio borrar no es una fecha que alguien pidió.
            if (!value) return;
            timer.current = setTimeout(() => go({ fecha: value }), DEBOUNCE_MS);
          }}
          className={`mt-2 ${FIELD}`}
        />
      </div>

      {/* Ocupa lugar siempre, así la grilla no salta al aparecer. */}
      <p className="min-h-6 text-[0.95rem] text-muted sm:col-span-2" aria-live="polite">
        {isPending ? "Buscando horarios…" : ""}
      </p>
    </div>
  );
}
