"use client";

import { useActionState, useState } from "react";

import { addBlock } from "@/app/actions/schedule";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { SelectField, TextField } from "@/components/fields";
import { FormAlert } from "@/components/form-alert";
import { useForm } from "@/components/use-form";
import { IDLE } from "@/lib/forms";
import { blockSchema } from "@/lib/schemas";

export type BlockFormOption = { id: string; name: string };

/** Alta de un cierre. Controlado por el mismo motivo que [ShiftForm]. */
export function BlockForm({
  practitioners,
  locations,
}: {
  practitioners: BlockFormOption[];
  locations: BlockFormOption[];
}) {
  const [state, formAction] = useActionState(addBlock, IDLE);
  // Vacío = todos, y es el default: un feriado no es de nadie ni de una sede.
  const form = useForm(
    blockSchema,
    { practitionerId: "", locationId: "", from: "", to: "", reason: "" },
    state,
  );

  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") form.reset();
  }

  return (
    <form action={formAction} onSubmit={form.onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="blockPractitioner"
          label="Para quién"
          className={locations.length > 1 ? "" : "sm:col-span-2"}
          {...form.field("practitionerId")}
        >
          <option value="">Todos los profesionales</option>
          {practitioners.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </SelectField>

        {locations.length > 1 && (
          <SelectField id="blockLocation" label="En qué sede" {...form.field("locationId")}>
            <option value="">Todas las sedes</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </SelectField>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField id="from" label="Desde" type="date" required {...form.field("from")} />
        <TextField id="to" label="Hasta (incluido)" type="date" required {...form.field("to")} />
      </div>

      <TextField
        id="reason"
        label="Motivo"
        optional
        hint="Para acordarte después. No lo ven los pacientes."
        {...form.field("reason")}
      />

      <FormAlert state={state} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        <SubmitButton>Cerrar esos días</SubmitButton>
        <ActionResult state={state} saved="Listo, esos días ya no se pueden reservar." />
      </div>
    </form>
  );
}
