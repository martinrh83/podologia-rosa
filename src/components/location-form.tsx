"use client";

import { useActionState, useState } from "react";

import { createLocation, type LocationState } from "@/app/actions/locations";

const INITIAL: LocationState = { status: "idle" };

/** Alta de una sede. Controlado por el mismo motivo que el resto del panel. */
export function NewLocationForm() {
  const [state, formAction, isPending] = useActionState(createLocation, INITIAL);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") {
      setName("");
      setAddress("");
      setMapUrl("");
    }
  }

  return (
    <form action={formAction} className="mt-4 rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="name"
          label="Nombre"
          hint="Corto, para distinguirla. Ej: Centro."
          value={name}
          onChange={setName}
        />
        <Field id="address" label="Dirección" value={address} onChange={setAddress} />
      </div>

      <div className="mt-3">
        <Field
          id="mapUrl"
          label="Enlace del mapa"
          hint="Opcional. Pegá el enlace de Google Maps."
          value={mapUrl}
          onChange={setMapUrl}
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="mt-3 text-[0.95rem] text-[color:var(--danger)]">
          {state.message}
        </p>
      )}
      {state.status === "saved" && (
        <p role="status" className="mt-3 text-[0.95rem] text-[color:var(--success)]">
          Listo, ya se le pueden cargar horarios.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-3 rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Agregar sede"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
      />
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
