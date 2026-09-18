"use client";

import { useActionState, useState } from "react";
import type { z } from "zod";

import { updateLocation } from "@/app/actions/locations";
import { updatePractitioner } from "@/app/actions/practitioners";
import { updateService } from "@/app/actions/schedule";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { MoneyField, TextField } from "@/components/fields";
import { FormAlert } from "@/components/form-alert";
import { useForm } from "@/components/use-form";
import { IDLE, type ActionState } from "@/lib/forms";
import { locationSchema, practitionerSchema, serviceSchema } from "@/lib/schemas";

/**
 * Las fichas editables de las listas del panel: profesionales, sedes, precios.
 *
 * Cada ficha valida como cualquier otro formulario del sitio —el error en el
 * campo, al salir de él y al guardar— y dice «Guardando…» y después
 * «Guardado.» o el error.
 *
 * Los campos están controlados por lo mismo que las altas: React vacía un
 * formulario no controlado al terminar la acción, y ante un error eso le
 * borraba a Rosa lo que acababa de escribir.
 */
function useEditForm<V extends Record<string, string>>(
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>,
  schema: z.ZodType,
  initial: V,
) {
  const [state, formAction] = useActionState(action, IDLE);
  const form = useForm(schema, initial, state);

  // En cuanto se toca algo, el «Guardado» de antes deja de ser cierto.
  const [dirty, setDirty] = useState(false);
  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    setDirty(false);
  }

  return {
    state,
    form,
    formProps: {
      action: formAction,
      onSubmit: form.onSubmit,
      onChange: () => setDirty(true),
      noValidate: true,
    },
    hideSaved: dirty && state.status === "saved",
  };
}

function Footer({ state, hidden }: { state: ActionState; hidden: boolean }) {
  return (
    <div className="mt-5 space-y-4">
      <FormAlert state={state} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SubmitButton variant="outline" size="sm">
          Guardar cambios
        </SubmitButton>
        <ActionResult state={state} saved="Guardado." hidden={hidden} />
      </div>
    </div>
  );
}

export function EditPractitionerForm({
  practitioner,
}: {
  practitioner: {
    id: string;
    first_name: string;
    last_name: string;
    title: string | null;
    slot_minutes: number;
  };
}) {
  const id = practitioner.id;
  const { state, form, formProps, hideSaved } = useEditForm(updatePractitioner, practitionerSchema, {
    firstName: practitioner.first_name,
    lastName: practitioner.last_name,
    title: practitioner.title ?? "",
    slotMinutes: String(practitioner.slot_minutes),
  });

  return (
    <form {...formProps}>
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id={`fn-${id}`} label="Nombre" required {...form.field("firstName")} />
        <TextField id={`ln-${id}`} label="Apellido" required {...form.field("lastName")} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_10rem]">
        <TextField
          id={`ti-${id}`}
          label="Título"
          optional
          hint="Se ve debajo del nombre. Ej: Podóloga · MP 1234"
          {...form.field("title")}
        />
        <TextField
          id={`sm-${id}`}
          label="Turno (min)"
          type="number"
          required
          min="5"
          step="5"
          inputMode="numeric"
          {...form.field("slotMinutes")}
        />
      </div>

      <Footer state={state} hidden={hideSaved} />
    </form>
  );
}

export function EditLocationForm({
  location,
}: {
  location: { id: string; name: string; address: string; map_url: string | null };
}) {
  const id = location.id;
  const { state, form, formProps, hideSaved } = useEditForm(updateLocation, locationSchema, {
    name: location.name,
    address: location.address,
    mapUrl: location.map_url ?? "",
  });

  return (
    <form {...formProps}>
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <TextField id={`n-${id}`} label="Nombre" required {...form.field("name")} />
        <TextField id={`a-${id}`} label="Dirección" required {...form.field("address")} />
      </div>

      <TextField
        id={`m-${id}`}
        label="Enlace del mapa"
        optional
        type="url"
        className="mt-4"
        {...form.field("mapUrl")}
      />

      <Footer state={state} hidden={hideSaved} />
    </form>
  );
}

export function EditServiceForm({
  service,
}: {
  service: { id: string; name: string; price: number | null };
}) {
  const id = service.id;
  const { state, form, formProps, hideSaved } = useEditForm(updateService, serviceSchema, {
    name: service.name,
    price: service.price === null ? "" : String(service.price),
  });

  return (
    <form {...formProps}>
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <TextField id={`name-${id}`} label="Nombre" required {...form.field("name")} />
        <MoneyField id={`price-${id}`} label="Precio" step="100" {...form.field("price")} />
      </div>

      <Footer state={state} hidden={hideSaved} />
    </form>
  );
}
