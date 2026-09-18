"use client";

import { useActionState, useState } from "react";

import { addShift } from "@/app/actions/schedule";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { SelectField, TextField } from "@/components/fields";
import { FormAlert } from "@/components/form-alert";
import { useForm } from "@/components/use-form";
import { IDLE } from "@/lib/forms";
import { shiftSchema } from "@/lib/schemas";
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
  const form = useForm(
    shiftSchema,
    {
      // De quién es la franja: lo define el selector de arriba de la pantalla.
      practitionerId,
      locationId: locations[0]?.id ?? "",
      weekday: "1",
      startTime: "",
      endTime: "",
    },
    state,
  );

  // Al guardar se vacían las horas y quedan el día y la sede: lo que sigue
  // suele ser la otra franja del mismo día, o el mismo horario otro día.
  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") form.reset({ ...form.values, startTime: "", endTime: "" });
  }

  return (
    <form action={formAction} onSubmit={form.onSubmit} noValidate>
      <input type="hidden" name="practitionerId" value={practitionerId} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {locations.length > 1 ? (
          <SelectField id="locationId" label="Sede" {...form.field("locationId")}>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </SelectField>
        ) : (
          <input type="hidden" name="locationId" value={form.values.locationId} />
        )}

        <SelectField
          id="weekday"
          label="Día"
          // Sin sede que elegir, el día ocupa su lugar y la fila queda pareja.
          className={locations.length > 1 ? "" : "col-span-2"}
          {...form.field("weekday")}
        >
          {WEEKDAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </SelectField>

        <TextField id="startTime" label="Desde" type="time" required {...form.field("startTime")} />
        <TextField id="endTime" label="Hasta" type="time" required {...form.field("endTime")} />
      </div>

      <div className="mt-5 space-y-4">
        <FormAlert state={state} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SubmitButton>Agregar franja</SubmitButton>
          <ActionResult state={state} saved="Listo, la franja ya está cargada." />
        </div>
      </div>
    </form>
  );
}
