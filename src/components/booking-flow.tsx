"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CopyLink } from "@/components/copy-link";
import {
  EMPTY_FORM,
  firstInvalidField,
  validateField,
  validateForm,
  type FieldErrors,
  type FieldName,
  type PatientForm,
} from "@/lib/booking-form";
import { COVERAGES } from "@/lib/booking-schema";
import { capitalizeFirst, whatsappLink } from "@/lib/format";

export type BookingSlot = { startsAt: string; label: string; locationId: string };

export type BookingDay = {
  key: string;
  label: string;
  shortLabel: string;
  /**
   * La sede, cuando todo el día se atiende en una sola — que es lo normal.
   * En null el día está partido entre dos, y entonces la sede va en cada
   * horario: nadie tiene que adivinar adónde ir.
   */
  locationName: string | null;
  slots: BookingSlot[];
};

/** Las sedes, para resolver el nombre y la dirección del horario elegido. */
export type BookingLocation = { id: string; name: string; address: string };

/** La profesional elegida en /turnos. Ya está decidida cuando se llega acá. */
export type BookingPractitioner = {
  id: string;
  name: string;
  title: string | null;
};

type Props = {
  practitioner: BookingPractitioner;
  days: BookingDay[];
  locations: BookingLocation[];
  horizonDays: number;
  clinicPhone: string | null;
  clinicWhatsapp: string | null;
  clinicName: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; slotTaken: boolean }
  | {
      kind: "done";
      slotLabel: string;
      dayLabel: string;
      practitionerName: string;
      locationLine: string;
      cancelUrl: string;
    };

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

export function BookingFlow({
  practitioner,
  days,
  locations,
  horizonDays,
  clinicPhone,
  clinicWhatsapp,
  clinicName,
}: Props) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("cuando");
  const [selectedDayKey, setSelectedDayKey] = useState(days[0]?.key ?? null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [form, setForm] = useState<PatientForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
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

  const byId = new Map(locations.map((location) => [location.id, location]));
  const slotLocation = selectedSlot ? (byId.get(selectedSlot.locationId) ?? null) : null;
  // Con una sola sede el nombre no agrega nada: el sitio entero es esa sede.
  const showLocationName = locations.length > 1;

  function update<K extends FieldName>(key: K, value: PatientForm[K]) {
    const next = { ...form, [key]: value };
    setForm(next);

    // Premiar temprano. Mientras el campo esté limpio no se lo molesta: marcar
    // "Ingresá tu nombre" cuando alguien todavía va por la "M" de María es
    // retarlo por no haber terminado. Pero una vez que el campo ya está
    // marcado, se revalida en cada tecla para que el error desaparezca apenas
    // lo corrige, sin esperar a que se vaya del campo.
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: validateField(key, next) ?? undefined }));
    }
  }

  /**
   * Castigar tarde: el error aparece recién cuando el campo se da por
   * terminado, no mientras se escribe.
   */
  function handleBlur(key: FieldName) {
    setErrors((current) => ({ ...current, [key]: validateField(key, form) ?? undefined }));
  }

  function pickSlot(slot: BookingSlot) {
    setSelectedSlot(slot);
    setStatus({ kind: "idle" });
    setStep("datos");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) return;

    const found = validateForm(form);
    const firstInvalid = firstInvalidField(found);

    if (firstInvalid) {
      setErrors(found);
      // Sin esto, en un teléfono el error puede quedar fuera de pantalla y
      // parece que el botón no hizo nada. `focus` además lo trae a la vista.
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setErrors({});
    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          practitionerId: practitioner.id,
          startsAt: selectedSlot.startsAt,
        }),
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
        practitionerName: practitioner.name,
        locationLine: slotLocation
          ? showLocationName
            ? `${slotLocation.name} · ${slotLocation.address}`
            : slotLocation.address
          : "",
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
      {/*
        La profesional queda a la vista todo el tiempo, con la salida al lado.
        Se eligió en la pantalla anterior, así que no es un paso del wizard: es
        el contexto de los dos pasos que siguen.
      */}
      <PractitionerHeader practitioner={practitioner} />

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
                    {showLocationName && day.locationName && (
                      <span
                        className={`mt-0.5 block text-[0.75rem] uppercase tracking-wide ${
                          isSelected ? "text-white/80" : "text-accent"
                        }`}
                      >
                        {day.locationName}
                      </span>
                    )}
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
                      {showLocationName && !selectedDay.locationName && (
                        <span
                          className={`mt-0.5 block text-[0.75rem] uppercase tracking-wide ${
                            isSelected ? "text-white/80" : "text-accent"
                          }`}
                        >
                          {byId.get(slot.locationId)?.name}
                        </span>
                      )}
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
                {slotLocation && (
                  <p className="mt-0.5 text-[0.95rem] text-muted">
                    {showLocationName && <strong>{slotLocation.name} · </strong>}
                    {slotLocation.address}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep("cuando")}
                className="shrink-0 rounded-lg border border-[color:var(--accent)]/40 bg-surface px-4 py-2.5 text-[0.95rem] font-medium text-accent hover:border-accent"
              >
                Cambiar
              </button>
            </div>

            {/*
              `noValidate` apaga los globitos nativos del navegador: se ven
              distintos en cada uno, no se pueden estilar y se van solos. Si nos
              hacemos cargo de la validación, nos hacemos cargo entera. El
              atributo `required` se queda igual, porque es lo que hace que un
              lector de pantalla anuncie el campo como obligatorio.
            */}
            <form
              noValidate
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
                  error={errors.patientFirstName}
                  onChange={(value) => update("patientFirstName", value)}
                  onBlur={() => handleBlur("patientFirstName")}
                />
                <Field
                  label="Apellido"
                  name="patientLastName"
                  required
                  autoComplete="family-name"
                  value={form.patientLastName}
                  error={errors.patientLastName}
                  onChange={(value) => update("patientLastName", value)}
                  onBlur={() => handleBlur("patientLastName")}
                />
              </div>

              <Field
                label="DNI"
                name="patientDni"
                required
                inputMode="numeric"
                hint="Sin puntos ni espacios."
                value={form.patientDni}
                error={errors.patientDni}
                onChange={(value) => update("patientDni", value)}
                onBlur={() => handleBlur("patientDni")}
              />

              <fieldset
                role="radiogroup"
                aria-invalid={errors.patientCoverage ? true : undefined}
                aria-describedby={errors.patientCoverage ? "patientCoverage-error" : undefined}
              >
                <legend className="text-[0.95rem] font-medium">Obra social</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {COVERAGES.map((coverage, index) => (
                    <label
                      key={coverage.value}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-3 text-[1rem] hover:border-accent"
                    >
                      <input
                        // El primero lleva el id del grupo: es al que se le
                        // manda el foco si el paciente no eligió ninguna.
                        id={index === 0 ? "patientCoverage" : undefined}
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
                <FieldError id="patientCoverage-error" message={errors.patientCoverage} />
              </fieldset>

              <Field
                label="Teléfono"
                name="patientPhone"
                type="tel"
                required
                autoComplete="tel"
                hint="Para avisarte si surge algún cambio."
                value={form.patientPhone}
                error={errors.patientPhone}
                onChange={(value) => update("patientPhone", value)}
                onBlur={() => handleBlur("patientPhone")}
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
                  aria-describedby={`motivo-hint${errors.motivo ? " motivo-error" : ""}`}
                  aria-invalid={errors.motivo ? true : undefined}
                  onChange={(event) => update("motivo", event.target.value)}
                  onBlur={() => handleBlur("motivo")}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[1rem]"
                />
                <p id="motivo-hint" className="mt-1 text-sm text-muted">
                  Contanos solo si querés. Nos ayuda a preparar la consulta.
                </p>
                <FieldError id="motivo-error" message={errors.motivo} />
              </div>

              {/*
                Explicit consent, naming health data. The motivo field above is a
                dato sensible under Ley 25.326 art. 2, so a generic "acepto los
                términos" would not be valid consent for it.
              */}
              <div>
              <label className="flex items-start gap-3 text-[0.95rem]">
                <input
                  id="consent"
                  type="checkbox"
                  name="consent"
                  required
                  aria-describedby={errors.consent ? "consent-error" : undefined}
                  aria-invalid={errors.consent ? true : undefined}
                  checked={form.consent}
                  onChange={(event) => update("consent", event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  Autorizo a Podología Mitre a guardar mis datos de contacto y, si lo completé, el
                  motivo de mi consulta —un dato de salud— con el fin de gestionar mi turno.{" "}
                  <a href="/privacidad" target="_blank" className="text-accent underline">
                    Ver cómo tratamos tus datos
                  </a>
                  .
                </span>
              </label>
              <FieldError id="consent-error" message={errors.consent} />
              </div>

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

function PractitionerHeader({ practitioner }: { practitioner: BookingPractitioner }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted p-4">
      <div>
        <p className="text-sm text-muted">Tu turno es con</p>
        <p className="text-[1.05rem] font-medium">{practitioner.name}</p>
        {practitioner.title && (
          <p className="text-[0.95rem] text-muted">{practitioner.title}</p>
        )}
      </div>
      <Link
        href="/turnos"
        className="shrink-0 rounded-lg border border-border bg-surface px-4 py-2.5 text-[0.95rem] font-medium hover:border-accent"
      >
        Cambiar
      </Link>
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
  error,
  onChange,
  onBlur,
}: {
  label: string;
  name: string;
  hint?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text";
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

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
        // Los dos, en orden: primero la ayuda, después el error.
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-[1rem] ${
          error ? "border-[color:var(--danger)]" : "border-border"
        }`}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}

/**
 * El error de un campo.
 *
 * Siempre está en el DOM, aunque esté vacío: una región `aria-live` tiene que
 * existir *antes* de que aparezca el texto, si no el lector de pantalla no
 * anuncia nada. Eso cubre el caso de quien se va del campo con un error y
 * nunca lo ve.
 *
 * El texto es texto, no sólo un borde rojo: el color por sí solo no alcanza
 * (WCAG 1.4.1) y además no dice *qué* está mal.
 */
function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p
      id={id}
      aria-live="polite"
      className={`text-sm text-[color:var(--danger)] ${message ? "mt-1" : ""}`}
    >
      {message ?? ""}
    </p>
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
    `Hola! Saqué un turno en ${clinicName} con ${status.practitionerName} para el ` +
    `${status.dayLabel} a las ${status.slotLabel}` +
    (status.locationLine ? ` en ${status.locationLine}` : "") +
    `.` +
    (absoluteCancelUrl ? ` Este es mi enlace por si necesito cancelar: ${absoluteCancelUrl}` : "");

  return (
    <Notice tone="success" title="¡Listo! Tu turno quedó confirmado">
      <p className="text-[1.05rem] text-foreground">
        {capitalizeFirst(status.dayLabel)} a las {status.slotLabel}, con{" "}
        {status.practitionerName}.
      </p>
      {status.locationLine && (
        <p className="mt-1 text-[1.05rem] font-medium text-foreground">{status.locationLine}</p>
      )}

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
