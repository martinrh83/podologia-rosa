"use client";

import { useActionState, useState } from "react";

import {
  createPractitioner,
  createSpecialty,
  type PractitionerState,
} from "@/app/actions/practitioners";

const INITIAL: PractitionerState = { status: "idle" };

export type SpecialtyOption = { id: string; name: string };

/** Alta de un profesional. Controlado por el mismo motivo que el resto del panel. */
export function NewPractitionerForm({ specialties }: { specialties: SpecialtyOption[] }) {
  const [state, formAction, isPending] = useActionState(createPractitioner, INITIAL);

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
      <p className="mt-4 rounded-xl border border-border bg-surface-muted p-4 text-muted">
        Cargá primero una especialidad.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4 rounded-xl border border-border bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="firstName" label="Nombre" value={firstName} onChange={setFirstName} />
        <Field id="lastName" label="Apellido" value={lastName} onChange={setLastName} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field
          id="title"
          label="Título"
          hint="Cómo se muestra debajo del nombre. Ej: Podóloga · MP 1234"
          value={title}
          onChange={setTitle}
        />

        <div>
          <label htmlFor="specialtyId" className="block text-sm font-medium">
            Especialidad
          </label>
          <select
            id="specialtyId"
            name="specialtyId"
            value={specialtyId}
            onChange={(event) => setSpecialtyId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
          >
            {specialties.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="slotMinutes" className="block text-sm font-medium">
          Duración del turno
        </label>
        <input
          id="slotMinutes"
          name="slotMinutes"
          type="number"
          min="5"
          step="5"
          inputMode="numeric"
          value={slotMinutes}
          onChange={(event) => setSlotMinutes(event.target.value)}
          className="mt-1 w-32 rounded-lg border border-border bg-background px-3 py-2.5 tabular-nums"
        />
        <p className="mt-1 text-sm text-muted">
          En minutos. Cada profesional puede tener la suya.
        </p>
      </div>

      <Result state={state} saved="Listo, ya se puede sacarle turno." />

      <button
        type="submit"
        disabled={isPending}
        className="mt-3 rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Agregar profesional"}
      </button>
    </form>
  );
}

export function NewSpecialtyForm() {
  const [state, formAction, isPending] = useActionState(createSpecialty, INITIAL);
  const [name, setName] = useState("");

  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") setName("");
  }

  return (
    <form action={formAction} className="mt-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grow">
          <label htmlFor="name" className="block text-sm font-medium">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Agregar"}
        </button>
      </div>

      <Result state={state} saved="Especialidad cargada." />
    </form>
  );
}

function Result({ state, saved }: { state: PractitionerState; saved: string }) {
  if (state.status === "error") {
    return (
      <p role="alert" className="mt-3 text-[0.95rem] text-[color:var(--danger)]">
        {state.message}
      </p>
    );
  }

  if (state.status === "saved") {
    return (
      <p role="status" className="mt-3 text-[0.95rem] text-[color:var(--success)]">
        {saved}
      </p>
    );
  }

  return null;
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
