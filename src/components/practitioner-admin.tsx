"use client";

import { useActionState, useState } from "react";

import { createPractitioner, createSpecialty } from "@/app/actions/practitioners";
import { IDLE } from "@/app/actions/state";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { SelectField, TextField } from "@/components/admin/fields";
import { Notice } from "@/components/notice";

export type SpecialtyOption = { id: string; name: string };

/** Alta de un profesional. Controlado por el mismo motivo que el resto del panel. */
export function NewPractitionerForm({ specialties }: { specialties: SpecialtyOption[] }) {
  const [state, formAction] = useActionState(createPractitioner, IDLE);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [slotMinutes, setSlotMinutes] = useState("60");
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id ?? "");

  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") {
      setFirstName("");
      setLastName("");
      setTitle("");
      setSlotMinutes("60");
    }
  }

  if (specialties.length === 0) {
    return (
      <Notice tone="muted" title="Falta una especialidad">
        Cada profesional pertenece a una. Cargá la primera en Especialidades.
      </Notice>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="firstName"
          label="Nombre"
          required
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <TextField
          id="lastName"
          label="Apellido"
          required
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="specialtyId"
          label="Especialidad"
          value={specialtyId}
          onChange={(event) => setSpecialtyId(event.target.value)}
        >
          {specialties.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {specialty.name}
            </option>
          ))}
        </SelectField>
        <TextField
          id="slotMinutes"
          label="Turno (min)"
          type="number"
          min="5"
          step="5"
          inputMode="numeric"
          hint="Cada profesional puede tener la suya."
          value={slotMinutes}
          onChange={(event) => setSlotMinutes(event.target.value)}
        />
      </div>

      <TextField
        id="title"
        label="Título"
        optional
        hint="Se ve debajo del nombre. Ej: Podóloga · MP 1234"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        <SubmitButton>Agregar profesional</SubmitButton>
        <ActionResult state={state} saved="Listo, ya se le puede sacar turno." />
      </div>
    </form>
  );
}

export function NewSpecialtyForm() {
  const [state, formAction] = useActionState(createSpecialty, IDLE);
  const [name, setName] = useState("");

  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") setName("");
  }

  return (
    <form action={formAction}>
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          id="name"
          label="Nombre"
          required
          className="min-w-[14rem] grow"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <SubmitButton>Agregar</SubmitButton>
      </div>
      <div className="mt-2">
        <ActionResult state={state} saved="Especialidad cargada." />
      </div>
    </form>
  );
}
