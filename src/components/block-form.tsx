"use client";

import { useActionState, useState } from "react";

import { addBlock } from "@/app/actions/schedule";
import { IDLE } from "@/app/actions/state";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { SelectField, TextField } from "@/components/admin/fields";

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

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  // Vacío = todos, y es el default: un feriado no es de nadie ni de una sede.
  const [practitionerId, setPractitionerId] = useState("");
  const [locationId, setLocationId] = useState("");

  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") {
      setFrom("");
      setTo("");
      setReason("");
      setPractitionerId("");
      setLocationId("");
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="blockPractitioner"
          name="practitionerId"
          label="Para quién"
          value={practitionerId}
          onChange={(event) => setPractitionerId(event.target.value)}
          className={locations.length > 1 ? "" : "sm:col-span-2"}
        >
          <option value="">Todos los profesionales</option>
          {practitioners.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </SelectField>

        {locations.length > 1 && (
          <SelectField
            id="blockLocation"
            name="locationId"
            label="En qué sede"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
          >
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
        <TextField
          id="from"
          label="Desde"
          type="date"
          required
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <TextField
          id="to"
          label="Hasta (incluido)"
          type="date"
          required
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </div>

      <TextField
        id="reason"
        label="Motivo"
        optional
        hint="Para acordarte después. No lo ven los pacientes."
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        <SubmitButton>Cerrar esos días</SubmitButton>
        <ActionResult state={state} saved="Listo, esos días ya no se pueden reservar." />
      </div>
    </form>
  );
}
