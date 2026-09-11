"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CopyLink } from "@/components/copy-link";
import { COVERAGES } from "@/lib/booking-schema";
import { capitalizeFirst, whatsappLink } from "@/lib/format";

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
  clinicWhatsapp: string | null;
  clinicName: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; slotTaken: boolean }
  | { kind: "done"; slotLabel: string; dayLabel: string; cancelUrl: string };

/**
 * Los dos pasos del flujo.
 *
 * Son dos y no tres porque el día y el horario son una sola decisión —cuándo—
 * y se toma mejor viendo la grilla entera mientras se cambia de día. Partirlos
 * agregaría un toque más sin agregar claridad.
 *
 * Y el formulario tampoco se parte: seis campos entran en una pantalla. Un
 * wizard sirve cuando baja la complejidad percibida o cuando un paso depende
 * del anterior; acá haría las dos cosas peor.
 */
type Step = "cuando" | "datos";

/**
 * Los datos del paciente viven en el estado, no en el DOM.
 *
 * Es lo que hace que un 409 —alguien tomó el horario mientras completaba— no
 * castigue al que perdió: se lo manda de vuelta al paso 1 a elegir otro horario
 * y el formulario reaparece con todo lo que ya había escrito.
 */
type PatientForm = {
  patientFirstName: string;
  patientLastName: string;
  patientDni: string;
  patientCoverage: string;
  patientPhone: string;
  motivo: string;
  consent: boolean;
};

const EMPTY_FORM: PatientForm = {
  patientFirstName: "",
  patientLastName: "",
  patientDni: "",
  patientCoverage: "",
  patientPhone: "",
  motivo: "",
  consent: false,
};

export function BookingFlow({ days, horizonDays, clinicPhone, clinicWhatsapp, clinicName }: Props) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("cuando");
  const [selectedDayKey, setSelectedDayKey] = useState(days[0]?.key ?? null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [form, setForm] = useState<PatientForm>(EMPTY_FORM);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const topRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  // Un paso reemplaza al anterior, así que hay que decir que la pantalla cambió.
  // Mover el foco lo anuncia a un lector de pantalla; el scroll lo muestra a
  // quien mira. `preventScroll` evita que el foco y el scroll se peleen.
  const stage = status.kind === "done" ? "done" : step;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    headingRef.current?.focus({ preventScroll: true });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [stage]);

  // Tras un refresh los días cambian: el que estaba elegido puede haberse
  // quedado sin horarios y desaparecer de la lista.
  const selectedDay = days.find((day) => day.key === selectedDayKey) ?? days[0] ?? null;

  // El día del turno elegido sale del turno mismo, no del día que esté marcado
  // en la tira: quien vuelve al paso 1 puede mirar otro día sin elegir nada, y
  // entonces los dos dejan de coincidir.
  const slotDay = selectedSlot
    ? days.find((day) => day.slots.some((slot) => slot.startsAt === selectedSlot.startsAt))
    : null;

  function update<K extends keyof PatientForm>(key: K, value: PatientForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function pickSlot(slot: BookingSlot) {
    setSelectedSlot(slot);
    setStatus({ kind: "idle" });
    setStep("datos");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) return;

    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startsAt: selectedSlot.startsAt }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        const slotTaken = response.status === 409;

        setStatus({
          kind: "error",
          message: body.error ?? "No pudimos guardar el turno. Probá de nuevo.",
          slotTaken,
        });

        if (slotTaken) {
          // La grilla en pantalla quedó vieja: todavía muestra el horario que
          // acaban de tomar. Volver al paso 1 con la lista sin actualizar sería
          // invitarlo a chocarse otra vez, así que se pide de nuevo al servidor.
          // `refresh` conserva el estado del cliente, incluido el formulario.
          router.refresh();
          setSelectedSlot(null);
          setStep("cuando");
        }

        return;
      }

      const body = (await response.json().catch(() => ({}))) as { cancelToken?: string };

      setStatus({
        kind: "done",
        slotLabel: selectedSlot.label,
        dayLabel: slotDay?.label ?? "",
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

  if (status.kind === "done") {
    return (
      <div ref={topRef}>
        <Confirmation
          status={status}
          clinicPhone={clinicPhone}
          clinicWhatsapp={clinicWhatsapp}
          clinicName={clinicName}
        />
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div ref={topRef}>
        <Notice tone="muted" title="Por ahora no hay horarios disponibles">
          <p>
            No quedan turnos libres en los próximos {horizonDays} días.
            {clinicPhone ? ` Escribinos o llamanos al ${clinicPhone} y vemos alternativas.` : ""}
          </p>
        </Notice>
      </div>
    );
  }

  return (
    <div ref={topRef} className="space-y-6">
      <Progress step={step} />

      {status.kind === "error" && status.slotTaken && (
        <Notice tone="danger" title="Ese horario ya no está libre">
          <p>{status.message} Elegí otro y seguimos con tus datos, que ya quedaron guardados.</p>
        </Notice>
      )}

      {step === "cuando" ? (
        <section aria-labelledby="cuando-heading" className="space-y-6">
          <h2
            id="cuando-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold tracking-tight"
          >
            ¿Cuándo te queda cómodo?
          </h2>

          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Día</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((day) => {
                const isSelected = day.key === selectedDay?.key;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDayKey(day.key)}
                    aria-pressed={isSelected}
                    className={`shrink-0 rounded-xl border px-4 py-3 text-center transition-colors ${
                      isSelected
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-surface hover:border-accent"
                    }`}
                  >
                    <span className="block text-[0.95rem] font-medium">
                      {capitalizeFirst(day.shortLabel)}
                    </span>
                    <span className={`block text-xs ${isSelected ? "text-white/80" : "text-muted"}`}>
                      {day.slots.length} {day.slots.length === 1 ? "horario" : "horarios"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDay && (
            <div>
              <p className="mb-1 text-sm font-medium uppercase tracking-wide text-muted">Horario</p>
              <p className="mb-3 text-lg">{capitalizeFirst(selectedDay.label)}</p>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {selectedDay.slots.map((slot) => {
                  const isSelected = slot.startsAt === selectedSlot?.startsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      onClick={() => pickSlot(slot)}
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

              <p className="mt-3 text-[0.95rem] text-muted">
                Tocá un horario y te pedimos los datos en el paso siguiente.
              </p>
            </div>
          )}
        </section>
      ) : (
        selectedSlot && (
          <section aria-labelledby="datos-heading" className="space-y-5">
            <h2
              id="datos-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-semibold tracking-tight"
            >
              Tus datos
            </h2>

            {/*
              El turno elegido queda a la vista mientras se completa el
              formulario, con la salida al lado: nadie tiene que acordarse de
              qué eligió ni volver atrás a ciegas para cambiarlo.
            */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--accent)]/30 bg-accent-soft p-4">
              <div>
                <p className="text-sm text-muted">Tu turno</p>
                <p className="text-[1.05rem] font-medium">
                  {capitalizeFirst(slotDay?.label ?? "")} · {selectedSlot.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("cuando")}
                className="shrink-0 rounded-lg border border-[color:var(--accent)]/40 bg-surface px-4 py-2.5 text-[0.95rem] font-medium text-accent hover:border-accent"
              >
                Cambiar
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-xl border border-border bg-surface p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre"
                  name="patientFirstName"
                  required
                  autoComplete="given-name"
                  value={form.patientFirstName}
                  onChange={(value) => update("patientFirstName", value)}
                />
                <Field
                  label="Apellido"
                  name="patientLastName"
                  required
                  autoComplete="family-name"
                  value={form.patientLastName}
                  onChange={(value) => update("patientLastName", value)}
                />
              </div>

              <Field
                label="DNI"
                name="patientDni"
                required
                inputMode="numeric"
                hint="Sin puntos ni espacios."
                value={form.patientDni}
                onChange={(value) => update("patientDni", value)}
              />

              <fieldset>
                <legend className="text-[0.95rem] font-medium">Obra social</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {COVERAGES.map((coverage) => (
                    <label
                      key={coverage.value}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-3 text-[1rem] hover:border-accent"
                    >
                      <input
                        type="radio"
                        name="patientCoverage"
                        value={coverage.value}
                        required
                        checked={form.patientCoverage === coverage.value}
                        onChange={() => update("patientCoverage", coverage.value)}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      {coverage.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field
                label="Teléfono"
                name="patientPhone"
                type="tel"
                required
                autoComplete="tel"
                hint="Para avisarte si surge algún cambio."
                value={form.patientPhone}
                onChange={(value) => update("patientPhone", value)}
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
                  value={form.motivo}
                  onChange={(event) => update("motivo", event.target.value)}
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
                  checked={form.consent}
                  onChange={(event) => update("consent", event.target.checked)}
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

              {status.kind === "error" && !status.slotTaken && (
                <Notice tone="danger" title="No pudimos guardar el turno">
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
        )
      )}
    </div>
  );
}

/** Dónde está parado el paciente y cuánto falta. */
function Progress({ step }: { step: Step }) {
  const current = step === "cuando" ? 1 : 2;

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">
        Paso {current} de 2
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        <span className="h-1 flex-1 rounded-full bg-accent" />
        <span className={`h-1 flex-1 rounded-full ${current === 2 ? "bg-accent" : "bg-border"}`} />
      </div>
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
  inputMode,
  value,
  onChange,
}: {
  label: string;
  name: string;
  hint?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text";
  value: string;
  onChange: (value: string) => void;
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
        inputMode={inputMode}
        aria-describedby={hintId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
  clinicWhatsapp,
  clinicName,
}: {
  status: Extract<Status, { kind: "done" }>;
  clinicPhone: string | null;
  clinicWhatsapp: string | null;
  clinicName: string;
}) {
  /*
    No hay canal automático para mandar una confirmación: sin dominio propio no
    hay mail, y automatizar WhatsApp exige la API de Business.

    Así que el mensaje lo manda el paciente. Resuelve dos cosas de una: le queda
    el turno y el enlace guardados en su propio WhatsApp, que es donde los va a
    buscar, y a Rosa le llega el aviso del turno nuevo sin mirar el panel.
  */
  const absoluteCancelUrl =
    status.cancelUrl && typeof window !== "undefined"
      ? new URL(status.cancelUrl, window.location.origin).toString()
      : status.cancelUrl;

  const confirmationMessage =
    `Hola! Saqué un turno en ${clinicName} para el ${status.dayLabel} a las ` +
    `${status.slotLabel}.` +
    (absoluteCancelUrl ? ` Este es mi enlace por si necesito cancelar: ${absoluteCancelUrl}` : "");

  return (
    <Notice tone="success" title="¡Listo! Tu turno quedó confirmado">
      <p className="text-[1.05rem] text-foreground">
        {capitalizeFirst(status.dayLabel)} a las {status.slotLabel}.
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

      {clinicWhatsapp && (
        <div className="mt-4">
          <a
            href={whatsappLink(clinicWhatsapp, confirmationMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-accent px-5 py-3 text-[1.05rem] font-medium text-white hover:bg-accent-hover"
          >
            Guardármelo en WhatsApp
          </a>
          <p className="mt-2 text-[0.95rem]">
            Te abre un mensaje con los datos del turno para mandarnos. Así te queda guardado en tu
            teléfono y nosotros nos enteramos.
          </p>
        </div>
      )}

      {clinicPhone && (
        <p className="mt-3">Si preferís, llamanos al {clinicPhone} y lo cancelamos nosotros.</p>
      )}
    </Notice>
  );
}
