"use client";

import { useActionState } from "react";

import { updateClinicSettings } from "@/app/actions/settings";
import { IDLE } from "@/app/actions/state";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { TextField } from "@/components/admin/fields";
import type { ClinicSettings } from "@/lib/db/types";

export function SettingsForm({ settings }: { settings: ClinicSettings }) {
  const [state, formAction] = useActionState(updateClinicSettings, IDLE);

  return (
    <form action={formAction} className="space-y-5">
      <TextField
        id="clinicName"
        label="Nombre del consultorio"
        defaultValue={settings.clinic_name}
        required
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="phone"
          label="Teléfono"
          type="tel"
          optional
          defaultValue={settings.phone ?? ""}
          hint="Se muestra tal cual lo escribas."
        />
        <TextField
          id="whatsapp"
          label="WhatsApp"
          type="tel"
          optional
          defaultValue={settings.whatsapp ?? ""}
          hint="Con característica, sin el 0 ni el 15. Ej: 387 555-4444."
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        <SubmitButton>Guardar cambios</SubmitButton>
        <ActionResult state={state} saved="Listo, los cambios ya se ven en la página." />
      </div>
    </form>
  );
}
