"use client";

import { useActionState } from "react";

import { updateClinicSettings } from "@/app/actions/settings";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { TextField } from "@/components/fields";
import { FormAlert } from "@/components/form-alert";
import { useForm } from "@/components/use-form";
import type { ClinicSettings } from "@/lib/db/types";
import { IDLE } from "@/lib/forms";
import { settingsSchema } from "@/lib/schemas";

/**
 * Los datos de contacto del consultorio.
 *
 * Controlado como el resto del panel: con `defaultValue`, un error del
 * servidor dejaba el formulario con los datos viejos y se perdía lo escrito.
 */
export function SettingsForm({ settings }: { settings: ClinicSettings }) {
  const [state, formAction] = useActionState(updateClinicSettings, IDLE);
  const form = useForm(
    settingsSchema,
    {
      clinicName: settings.clinic_name,
      phone: settings.phone ?? "",
      whatsapp: settings.whatsapp ?? "",
    },
    state,
  );

  return (
    <form action={formAction} onSubmit={form.onSubmit} noValidate className="space-y-5">
      <TextField
        id="clinicName"
        label="Nombre del consultorio"
        required
        {...form.field("clinicName")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="phone"
          label="Teléfono"
          type="tel"
          optional
          hint="Se muestra tal cual lo escribas."
          {...form.field("phone")}
        />
        <TextField
          id="whatsapp"
          label="WhatsApp"
          type="tel"
          optional
          hint="Con característica, sin el 0 ni el 15. Ej: 387 555-4444."
          {...form.field("whatsapp")}
        />
      </div>

      <FormAlert state={state} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        <SubmitButton>Guardar cambios</SubmitButton>
        <ActionResult state={state} saved="Listo, los cambios ya se ven en la página." />
      </div>
    </form>
  );
}
