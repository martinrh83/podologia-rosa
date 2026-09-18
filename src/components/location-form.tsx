"use client";

import { useActionState, useState } from "react";

import { createLocation } from "@/app/actions/locations";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { TextField } from "@/components/fields";
import { FormAlert } from "@/components/form-alert";
import { useForm } from "@/components/use-form";
import { IDLE } from "@/lib/forms";
import { locationSchema } from "@/lib/schemas";

/** Alta de una sede. Controlado por el mismo motivo que el resto del panel. */
export function NewLocationForm() {
  const [state, formAction] = useActionState(createLocation, IDLE);
  const form = useForm(locationSchema, { name: "", address: "", mapUrl: "" }, state);

  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") form.reset();
  }

  return (
    <form action={formAction} onSubmit={form.onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <TextField
          id="name"
          label="Nombre"
          required
          hint="Corto, para distinguirla. Ej: Centro."
          {...form.field("name")}
        />
        <TextField id="address" label="Dirección" required {...form.field("address")} />
      </div>

      <TextField
        id="mapUrl"
        label="Enlace del mapa"
        optional
        type="url"
        hint="Pegá el enlace de Google Maps."
        {...form.field("mapUrl")}
      />

      <FormAlert state={state} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        <SubmitButton>Agregar sede</SubmitButton>
        <ActionResult state={state} saved="Listo, ya se le pueden cargar horarios." />
      </div>
    </form>
  );
}
