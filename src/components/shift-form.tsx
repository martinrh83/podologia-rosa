"use client";

import { useActionState, useState } from "react";

import { addShift } from "@/app/actions/schedule";
import { IDLE } from "@/app/actions/state";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { SelectField, TextField } from "@/components/admin/fields";
import { WEEKDAYS } from "@/lib/weekdays";

/**
 * Alta de una franja horaria.
 *
 * Los campos están controlados a propósito. React limpia un formulario no
 * controlado cuando la acción termina, sin distinguir si guardó o falló: con
 * inputs sueltos, un rechazo mostraba el error y de paso le borraba a Rosa lo
 * que acababa de cargar. Acá el estado es nuestro y se limpia sólo al guardar.
 */
export type ShiftFormLocation = { id: string; name: string };

export function ShiftForm({
  practitionerId,
  locations,
}: {
  practitionerId: string;
  locations: ShiftFormLocation[];
}) {
  const [state, formAction] = useActionState(addShift, IDLE);

  const [weekday, setWeekday] = useState("1");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Ajustar el estado durante el render, no en un efecto: cuando llega un
  // resultado nuevo y fue exitoso, se vacían los campos. React lo resuelve
  // antes de pintar, sin el render en cascada que provoca un `useEffect`.
  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") {
      setStartTime("");
      setEndTime("");
    }
  }

  return (
    <form action={formAction}>
      {/* De quién es la franja: lo define el selector de arriba de la pantalla. */}
      <input type="hidden" name="practitionerId" value={practitionerId} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {locations.length > 1 ? (
          <SelectField
            id="locationId"
            label="Sede"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </SelectField>
        ) : (
          <input type="hidden" name="locationId" value={locationId} />
        )}

        <SelectField
          id="weekday"
          label="Día"
          value={weekday}
          onChange={(event) => setWeekday(event.target.value)}
          // Sin sede que elegir, el día ocupa su lugar y la fila queda pareja.
          className={locations.length > 1 ? "" : "col-span-2"}
        >
          {WEEKDAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </SelectField>

        <TextField
          id="startTime"
          label="Desde"
          type="time"
          required
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
        />
        <TextField
          id="endTime"
          label="Hasta"
          type="time"
          required
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <SubmitButton>Agregar franja</SubmitButton>
        <ActionResult state={state} saved="Listo, la franja ya está cargada." />
      </div>
    </form>
  );
}
