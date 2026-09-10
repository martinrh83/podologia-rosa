"use client";

import { useActionState } from "react";

import { updateClinicSettings, type SettingsState } from "@/app/actions/settings";
import type { ClinicSettings } from "@/lib/db/types";

const INITIAL: SettingsState = { status: "idle" };

export function SettingsForm({ settings }: { settings: ClinicSettings }) {
  const [state, formAction, isPending] = useActionState(updateClinicSettings, INITIAL);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <Field
        id="clinicName"
        label="Nombre del consultorio"
        defaultValue={settings.clinic_name}
        required
      />

      <Field
        id="address"
        label="Dirección"
        defaultValue={settings.address ?? ""}
        hint="Como querés que aparezca en la página."
      />

      <Field
        id="phone"
        label="Teléfono"
        type="tel"
        defaultValue={settings.phone ?? ""}
        hint="Se muestra tal cual lo escribas."
      />

      <Field
        id="whatsapp"
        label="WhatsApp"
        type="tel"
        defaultValue={settings.whatsapp ?? ""}
        hint="Con característica, sin el 0 ni el 15. Ej: 387 555-4444."
      />

      <Field
        id="mapUrl"
        label="Enlace del mapa"
        type="url"
        defaultValue={settings.map_url ?? ""}
        hint="Pegá el enlace de Google Maps del consultorio."
      />

      {state.status === "error" && (
        <p role="alert" className="text-[0.95rem] text-[color:var(--danger)]">
          {state.message}
        </p>
      )}

      {state.status === "saved" && (
        <p role="status" className="text-[0.95rem] text-[color:var(--success)]">
          Listo, los cambios ya se ven en la página.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-4 py-3 text-[1.05rem] font-medium text-white hover:bg-accent-hover disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  defaultValue,
  hint,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  defaultValue: string;
  hint?: string;
  type?: string;
  required?: boolean;
}) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-[0.95rem] font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        defaultValue={defaultValue}
        aria-describedby={hintId}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-3 text-[1.05rem]"
      />
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
