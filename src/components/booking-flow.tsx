"use client";

import { useState } from "react";

import { CopyLink } from "@/components/copy-link";

export type BookingSlot = { startsAt: string; label: string };

export type BookingDay = {
  key: string;
  label: string;
  shortLabel: string;
  slots: BookingSlot[];
};

type Props = {
  days: BookingDay[];
  horizonDays: number;
  clinicPhone: string | null;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; slotTaken: boolean }
  | { kind: "done"; slotLabel: string; dayLabel: string; cancelUrl: string };

export function BookingFlow({ days, horizonDays, clinicPhone }: Props) {
  const [selectedDayKey, setSelectedDayKey] = useState(days[0]?.key ?? null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const selectedDay = days.find((day) => day.key === selectedDayKey) ?? null;

  if (status.kind === "done") {
    return <Confirmation status={status} clinicPhone={clinicPhone} />;
  }

  if (days.length === 0) {
    return (
      <Notice tone="muted" title="Por ahora no hay horarios disponibles">
        <p>
          No quedan turnos libres en los próximos {horizonDays} días.
          {clinicPhone ? ` Escribinos o llamanos al ${clinicPhone} y vemos alternativas.` : ""}
        </p>
      </Notice>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) return;

    const formData = new FormData(event.currentTarget);
    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: selectedSlot.startsAt,
          patientName: String(formData.get("patientName") ?? ""),
          patientPhone: String(formData.get("patientPhone") ?? ""),
          motivo: String(formData.get("motivo") ?? ""),
          consent: formData.get("consent") === "on",
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus({
          kind: "error",
          message: body.error ?? "No pudimos guardar el turno. Probá de nuevo.",
          // 409 means the slot went while the form was open; the list on screen
          // is stale, so send the visitor back to pick again.
          slotTaken: response.status === 409,
        });
        if (response.status === 409) setSelectedSlot(null);
        return;
      }

      const body = (await response.json().catch(() => ({}))) as { cancelToken?: string };

      setStatus({
        kind: "done",
        slotLabel: selectedSlot.label,
        dayLabel: selectedDay?.label ?? "",
        // With no email to carry it, this link is shown once and never again.
        cancelUrl: body.cancelToken ? `/turnos/cancelar/${body.cancelToken}` : "",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.",
        slotTaken: false,
      });
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="dia-heading">
        <h2 id="dia-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          1. Elegí el día
        </h2>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((day) => {
            const isSelected = day.key === selectedDayKey;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => {
                  setSelectedDayKey(day.key);
                  setSelectedSlot(null);
                }}
                aria-pressed={isSelected}
                className={`shrink-0 rounded-xl border px-4 py-3 text-center transition-colors ${
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-surface hover:border-accent"
                }`}
              >
                <span className="block text-[0.95rem] font-medium capitalize">
                  {day.shortLabel}
                </span>
                <span className={`block text-xs ${isSelected ? "text-white/80" : "text-muted"}`}>
                  {day.slots.length} {day.slots.length === 1 ? "horario" : "horarios"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {selectedDay && (
        <section aria-labelledby="horario-heading">
          <h2
            id="horario-heading"
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted"
          >
            2. Elegí el horario
          </h2>
          <p className="mb-3 text-lg capitalize">{selectedDay.label}</p>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {selectedDay.slots.map((slot) => {
              const isSelected = slot.startsAt === selectedSlot?.startsAt;
              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  aria-pressed={isSelected}
                  // Generous tap target: many patients are older and on a phone.
                  className={`rounded-lg border px-3 py-3.5 text-[1.05rem] tabular-nums transition-colors ${
                    isSelected
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-surface hover:border-accent"
                  }`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {selectedSlot && (
        <section aria-labelledby="datos-heading">
          <h2
            id="datos-heading"
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted"
          >
            3. Tus datos
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <Field label="Nombre y apellido" name="patientName" required autoComplete="name" />
            <Field
              label="Teléfono"
              name="patientPhone"
              type="tel"
              required
              autoComplete="tel"
              hint="Para avisarte si surge algún cambio."
            />
            <div>
              <label htmlFor="motivo" className="block text-[0.95rem] font-medium">
                Motivo de la consulta <span className="font-normal text-muted">(opcional)</span>
              </label>
              <textarea
                id="motivo"
                name="motivo"
                rows={2}
                maxLength={500}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[1rem]"
              />
              <p className="mt-1 text-sm text-muted">
                Contanos solo si querés. Nos ayuda a preparar la consulta.
              </p>
            </div>

            {/*
              Explicit consent, naming health data. The motivo field above is a
              dato sensible under Ley 25.326 art. 2, so a generic "acepto los
              términos" would not be valid consent for it.
            */}
            <label className="flex items-start gap-3 text-[0.95rem]">
              <input
                type="checkbox"
                name="consent"
                required
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
              />
              <span>
                Autorizo a Podología Rosa a guardar mis datos de contacto y, si lo completé, el
                motivo de mi consulta —un dato de salud— con el fin de gestionar mi turno.{" "}
                <a href="/privacidad" target="_blank" className="text-accent underline">
                  Ver cómo tratamos tus datos
                </a>
                .
              </span>
            </label>

            {status.kind === "error" && (
              <Notice tone="danger" title={status.slotTaken ? "Ese horario ya no está libre" : "No pudimos guardar el turno"}>
                <p>{status.message}</p>
              </Notice>
            )}

            <button
              type="submit"
              disabled={status.kind === "submitting"}
              className="w-full rounded-lg bg-accent px-4 py-3.5 text-[1.05rem] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {status.kind === "submitting"
                ? "Confirmando…"
                : `Confirmar turno · ${selectedSlot.label}`}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  hint,
  type = "text",
  required = false,
  autoComplete,
}: {
  label: string;
  name: string;
  hint?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const hintId = hint ? `${name}-hint` : undefined;

  return (
    <div>
      <label htmlFor={name} className="block text-[0.95rem] font-medium">
        {label}
        {!required && <span className="font-normal text-muted"> (opcional)</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-describedby={hintId}
        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[1rem]"
      />
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: "muted" | "danger" | "success";
  title: string;
  children: React.ReactNode;
}) {
  const toneClass = {
    muted: "border-border bg-surface-muted",
    danger: "border-[color:var(--danger)]/30 bg-[color:var(--danger)]/5",
    success: "border-[color:var(--success)]/30 bg-[color:var(--success)]/5",
  }[tone];

  return (
    <div role="status" className={`rounded-xl border p-5 ${toneClass}`}>
      <p className="font-medium">{title}</p>
      <div className="mt-1 text-[0.95rem] text-muted">{children}</div>
    </div>
  );
}

function Confirmation({
  status,
  clinicPhone,
}: {
  status: Extract<Status, { kind: "done" }>;
  clinicPhone: string | null;
}) {
  return (
    <Notice tone="success" title="¡Listo! Tu turno quedó confirmado">
      <p className="text-[1.05rem] text-foreground">
        <span className="capitalize">{status.dayLabel}</span> a las {status.slotLabel}.
      </p>

      {status.cancelUrl ? (
        <div className="mt-4 rounded-lg border border-border bg-surface p-4">
          <p className="font-medium text-foreground">Guardá este enlace</p>
          <p className="mt-1">
            Es la única forma de cancelar el turno vos mismo. Sacale una captura o agregalo a
            favoritos: no te lo vamos a poder mandar por otro lado.
          </p>
          <div className="mt-3">
            <CopyLink href={status.cancelUrl} />
          </div>
        </div>
      ) : null}

      {clinicPhone && (
        <p className="mt-3">Si preferís, llamanos al {clinicPhone} y lo cancelamos nosotros.</p>
      )}
    </Notice>
  );
}
