"use client";

import { useActionState, useState } from "react";

import { createPractitioner, createSpecialty } from "@/app/actions/practitioners";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { SelectField, TextField } from "@/components/fields";
import { FormAlert } from "@/components/form-alert";
import { Notice } from "@/components/notice";
import { useForm } from "@/components/use-form";
import { IDLE } from "@/lib/forms";
import { newPractitionerSchema, specialtySchema } from "@/lib/schemas";

export type SpecialtyOption = { id: string; name: string };

/**
 * Alta de un profesional.
 *
 * Controlado por el mismo motivo que el resto del panel: React vacía un
 * formulario no controlado al terminar la acción, y ante un error eso borraba
 * lo que se acababa de escribir. Se vacía sólo cuando guardó.
 */
export function NewPractitionerForm({ specialties }: { specialties: SpecialtyOption[] }) {
  const [state, formAction] = useActionState(createPractitioner, IDLE);

  const empty = {
    firstName: "",
    lastName: "",
    title: "",
    slotMinutes: "60",
    specialtyId: specialties[0]?.id ?? "",
  };
  const form = useForm(newPractitionerSchema, empty, state);

  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    // La especialidad elegida queda: se suele cargar a varias de la misma.
    if (state.status === "saved") form.reset({ ...empty, specialtyId: form.values.specialtyId });
  }

  if (specialties.length === 0) {
    return (
      <Notice tone="muted" title="Falta una especialidad">
        Cada profesional pertenece a una. Cargá la primera en Especialidades.
      </Notice>
    );
  }

  return (
    <form action={formAction} onSubmit={form.onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="firstName" label="Nombre" required {...form.field("firstName")} />
        <TextField id="lastName" label="Apellido" required {...form.field("lastName")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField id="specialtyId" label="Especialidad" {...form.field("specialtyId")}>
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
          {...form.field("slotMinutes")}
        />
      </div>

      <TextField
        id="title"
        label="Título"
        optional
        hint="Se ve debajo del nombre. Ej: Podóloga · MP 1234"
        {...form.field("title")}
      />

      <FormAlert state={state} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        <SubmitButton>Agregar profesional</SubmitButton>
        <ActionResult state={state} saved="Listo, ya se le puede sacar turno." />
      </div>
    </form>
  );
}

export function NewSpecialtyForm() {
  const [state, formAction] = useActionState(createSpecialty, IDLE);
  const form = useForm(specialtySchema, { name: "" }, state);

  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") form.reset();
  }

  return (
    <form action={formAction} onSubmit={form.onSubmit} noValidate className="space-y-4">
      <TextField id="name" label="Nombre" required {...form.field("name")} />

      <FormAlert state={state} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        <SubmitButton>Agregar especialidad</SubmitButton>
        <ActionResult state={state} saved="Especialidad cargada." />
      </div>
    </form>
  );
}
