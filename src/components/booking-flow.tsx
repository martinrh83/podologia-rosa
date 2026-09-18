"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  Counter,
  PASOS,
  Pendientes,
  StepHeading,
  TurnoCard,
  TurnoStrip,
  type TurnoLine,
} from "@/components/booking/counter";
import { Notice } from "@/components/notice";
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
  /** "jue 17 sep": el único formato que entra en el renglón de la tarjeta. */
  cardLabel: string;
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
  /** Cuánto dura el turno con ella. Se lo decimos antes de que elija horario. */
  slotMinutes: number;
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
      dayCardLabel: string;
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
        dayCardLabel: slotDay?.cardLabel ?? "",
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

  // La tarjeta del mostrador: lo decidido, en birome; lo que falta, en blanco.
  const lines: TurnoLine[] = [
    { label: "Con", value: practitioner.name, note: practitioner.title },
    {
      label: "Día y hora",
      placeholder: "lo elegís vos",
      value:
        selectedSlot && slotDay ? `${capitalizeFirst(slotDay.cardLabel)} · ${selectedSlot.label}` : null,
      note:
        selectedSlot && slotLocation
          ? showLocationName
            ? `${slotLocation.name} · ${slotLocation.address}`
            : slotLocation.address
          : null,
    },
    {
      label: "A nombre de",
      placeholder: "tus datos",
      value: form.patientFirstName ? `${form.patientFirstName} ${form.patientLastName}`.trim() : null,
    },
  ];

  if (status.kind === "done") {
    const doneLines: TurnoLine[] = [
      { label: "Con", value: status.practitionerName },
      {
        label: "Día y hora",
        value: `${capitalizeFirst(status.dayCardLabel)} · ${status.slotLabel}`,
        note: status.locationLine || null,
      },
      {
        label: "A nombre de",
        value: `${form.patientFirstName} ${form.patientLastName}`.trim() || null,
      },
    ];

    return (
      <div ref={topRef} className="scroll-mt-28">
        <Counter
          aside={
            <TurnoCard lines={doneLines} stamp={{ text: "Confirmado", hint: "Podología Mitre" }} />
          }
        >
          <Confirmation
            status={status}
            clinicPhone={clinicPhone}
            clinicWhatsapp={clinicWhatsapp}
            clinicName={clinicName}
          />
        </Counter>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div ref={topRef} className="scroll-mt-28">
        <Counter aside={<TurnoCard lines={lines} className="max-lg:hidden" />}>
          <StepHeading step={2} of={3} headingRef={headingRef}>
            No quedan horarios libres
          </StepHeading>
          <div className="mt-8">
            <Notice tone="muted" title={`Sin turnos en los próximos ${horizonDays} días`}>
              <p>
                {clinicPhone
                  ? `Llamanos al ${clinicPhone} y vemos alternativas, o probá con otra profesional.`
                  : "Probá con otra profesional o escribinos y vemos alternativas."}
              </p>
              <p className="mt-4">
                <Link href="/turnos" className="font-bold text-accent underline underline-offset-4">
                  Ver quiénes atienden
                </Link>
              </p>
            </Notice>
          </div>
        </Counter>
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <Counter
        aside={
          <>
            <TurnoCard lines={lines} className="max-lg:hidden" />
            {step === "datos" && (
              <button
                type="button"
                onClick={() => setStep("cuando")}
                className="mt-5 hidden text-[0.95rem] text-muted underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground lg:block"
              >
                Cambiar día y hora
              </button>
            )}
            <Pendientes items={PASOS} current={step === "cuando" ? 1 : 2} />
          </>
        }
      >
        <TurnoStrip
          lines={lines}
          action={
            step === "datos"
              ? { label: "Cambiar", onClick: () => setStep("cuando") }
              : undefined
          }
        />

        {step === "cuando" ? (
          <section aria-labelledby="cuando-heading">
            <StepHeading
              step={2}
              of={3}
              headingRef={headingRef}
              lead={`Los turnos duran ${practitioner.slotMinutes} minutos.`}
            >
              ¿Cuándo te queda cómodo?
            </StepHeading>

            <p className="mt-4">
              <Link
                href="/turnos"
                className="text-[0.95rem] text-muted underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground"
              >
                Cambiar de profesional
              </Link>
            </p>

            {status.kind === "error" && status.slotTaken && (
              <div className="mt-8">
                <Notice tone="danger" title="Ese horario ya no está libre">
                  <p>{status.message} Elegí otro y seguimos: tus datos ya quedaron guardados.</p>
                </Notice>
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-4">
              <h3
                id="cuando-heading"
                className="font-narrow text-sm font-bold uppercase tracking-[0.12em] text-muted"
              >
                Día
              </h3>
              {/*
                Los días se corren con el dedo y el que sigue queda cortado al
                borde: sin este aviso, nadie sabe que hay más. La tira se desliza
                en cualquier pantalla, así que el aviso también va siempre.
              */}
              <p className="text-[0.95rem] text-muted">
                {days.length} {days.length === 1 ? "día" : "días"} con lugar · deslizá →
              </p>
            </div>
            {/*
              Una sola fila que se desliza, en cualquier resolución: los días
              quedan en orden y a la misma altura, sin reacomodarse en filas
              según entre el ancho.
            */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
              {days.map((day) => {
                const isSelected = day.key === selectedDay?.key;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDayKey(day.key)}
                    aria-pressed={isSelected}
                    // Ancho fijo para que la tira quede pareja: "1 horario" es
                    // más angosto que "4 horarios" y ese día salía más flaco
                    // que los demás.
                    className={`w-[7.5rem] shrink-0 border-2 px-4 py-3 text-center transition-[background-color,border-color,transform] duration-100 active:translate-y-0.5 ${
                      isSelected
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-surface hover:border-accent"
                    }`}
                  >
                    <span className="block font-narrow text-[0.95rem] font-bold uppercase tracking-[0.08em]">
                      {capitalizeFirst(day.shortLabel)}
                    </span>
                    <span className={`block text-[0.8rem] ${isSelected ? "text-white/85" : "text-muted"}`}>
                      {day.slots.length} {day.slots.length === 1 ? "horario" : "horarios"}
                    </span>
                    {showLocationName && day.locationName && (
                      <span
                        className={`mt-0.5 block font-narrow text-[0.75rem] font-bold uppercase tracking-[0.1em] ${
                          isSelected ? "text-white/85" : "text-accent"
                        }`}
                      >
                        {day.locationName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <div className="mt-10">
                <h3 className="font-narrow text-sm font-bold uppercase tracking-[0.12em] text-muted">
                  Horario
                </h3>
                <p className="mt-1 text-[1.15rem] font-bold">{capitalizeFirst(selectedDay.label)}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {selectedDay.slots.map((slot) => {
                    const isSelected = slot.startsAt === selectedSlot?.startsAt;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => pickSlot(slot)}
                        aria-pressed={isSelected}
                        // Área de toque generosa: mucha gente reserva desde el teléfono.
                        className={`border-2 px-3 py-4 text-[1.15rem] font-bold tabular-nums transition-[background-color,border-color,transform] duration-100 active:translate-y-0.5 ${
                          isSelected
                            ? "border-accent bg-accent text-white"
                            : "border-border bg-surface hover:border-accent"
                        }`}
                      >
                        {slot.label}
                        {showLocationName && !selectedDay.locationName && (
                          <span
                            className={`mt-0.5 block font-narrow text-[0.75rem] font-bold uppercase tracking-[0.1em] ${
                              isSelected ? "text-white/85" : "text-accent"
                            }`}
                          >
                            {byId.get(slot.locationId)?.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

              </div>
            )}
          </section>
        ) : (
          selectedSlot && (
            <section aria-labelledby="datos-heading">
              <StepHeading
                step={3}
                of={3}
                headingRef={headingRef}
                lead="Completá con tus datos personales para confirmar la reserva."
              >
                Tus datos
              </StepHeading>

              {/*
                `noValidate` apaga los globitos nativos del navegador: se ven
                distintos en cada uno, no se pueden estilar y se van solos. Si nos
                hacemos cargo de la validación, nos hacemos cargo entera. El
                atributo `required` se queda igual, porque es lo que hace que un
                lector de pantalla anuncie el campo como obligatorio.
              */}
              {/*
                Sin panel blanco alrededor: el formulario son renglones sobre la
                cartulina, y lo blanco son los campos. Dos planos blancos en una
                misma pantalla contradicen la tarjeta apoyada.
              */}
              <form noValidate onSubmit={handleSubmit} className="mt-10 space-y-7 border-t-2 border-foreground pt-8">
                <div className="grid gap-5 sm:grid-cols-2">
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
                  <legend className="font-narrow text-sm font-bold uppercase tracking-[0.1em] text-muted">
                    Obra social <span className="font-normal normal-case">(elegí una)</span>
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {COVERAGES.map((coverage, index) => (
                      <label
                        key={coverage.value}
                        className={`flex cursor-pointer items-center gap-3 border-2 bg-surface px-4 py-3.5 text-[1.05rem] font-bold transition-colors ${
                          form.patientCoverage === coverage.value
                            ? "border-accent text-accent"
                            : "border-border hover:border-accent"
                        }`}
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
                          className="casilla"
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
                  <label
                    htmlFor="motivo"
                    className="block font-narrow text-sm font-bold uppercase tracking-[0.1em] text-muted"
                  >
                    Motivo de la consulta <span className="font-normal normal-case">(opcional)</span>
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
                    className="mt-2 w-full border-2 border-border bg-surface px-3.5 py-3 text-[1.05rem]"
                  />
                  <p id="motivo-hint" className="mt-1.5 text-[0.95rem] text-muted">
                    Contanos sólo si querés. Nos ayuda a preparar la consulta.
                  </p>
                  <FieldError id="motivo-error" message={errors.motivo} />
                </div>

                {/*
                  Una sola autorización para todo el formulario. El motivo de la
                  consulta es un dato sensible (Ley 25.326 art. 2), pero quien lo
                  guarda es un establecimiento sanitario tratando a su paciente:
                  el art. 8 habilita ese tratamiento bajo secreto profesional, sin
                  necesidad de un consentimiento aparte. El detalle de qué se hace
                  con cada dato vive en /privacidad.
                */}
                <div>
                  <label className="flex cursor-pointer items-start gap-3 border-t border-border pt-5 text-[0.95rem] leading-relaxed">
                    <input
                      id="consent"
                      type="checkbox"
                      name="consent"
                      required
                      aria-describedby={errors.consent ? "consent-error" : undefined}
                      aria-invalid={errors.consent ? true : undefined}
                      checked={form.consent}
                      onChange={(event) => update("consent", event.target.checked)}
                      className="casilla mt-0.5"
                    />
                    <span>
                      Autorizo a Podología Mitre a guardar los datos proporcionados en este
                      formulario para confirmar mi reserva.{" "}
                      <a
                        href="/privacidad"
                        target="_blank"
                        className="font-bold text-accent underline underline-offset-4"
                      >
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
                  className="w-full border-2 border-accent bg-accent px-5 py-4 text-[1.15rem] font-bold text-white transition-[background-color,transform] duration-100 hover:border-accent-hover hover:bg-accent-hover active:translate-y-0.5 active:scale-[0.995] disabled:opacity-60"
                >
                  {status.kind === "submitting"
                    ? "Confirmando…"
                    : `Confirmar turno · ${selectedSlot.label}`}
                </button>
              </form>
            </section>
          )
        )}
      </Counter>
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
      <label
        htmlFor={name}
        className="block font-narrow text-sm font-bold uppercase tracking-[0.1em] text-muted"
      >
        {label}
        {!required && <span className="font-normal normal-case"> (opcional)</span>}
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
        className={`mt-2 w-full border-2 bg-surface px-3.5 py-3 text-[1.05rem] ${
          error ? "border-[color:var(--danger)]" : "border-border"
        }`}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-[0.95rem] text-muted">
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
      className={`text-[0.95rem] font-bold text-[color:var(--danger)] ${message ? "mt-1.5" : ""}`}
    >
      {message ?? ""}
    </p>
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
    buscar, y al consultorio le llega el aviso del turno nuevo sin mirar el panel.
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
    <div>
      <h1 className="font-wide text-[length:clamp(1.75rem,6vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">
        Listo, te esperamos.
      </h1>
      <p className="mt-4 text-[1.2rem] leading-relaxed">
        <strong className="font-bold text-[color:var(--success)]">Tu turno quedó confirmado:</strong>{" "}
        {status.dayLabel} a las {status.slotLabel}, con {status.practitionerName}
        {status.locationLine ? "." : "."}
      </p>
      {status.locationLine && (
        <p className="mt-1 text-[1.2rem] font-bold">{status.locationLine}</p>
      )}

      {/* La tarjeta con el sello vive al costado; acá va lo que hay que hacer con ella. */}
      {status.cancelUrl ? (
        <div className="mt-8 border-2 border-foreground bg-surface p-5 sm:p-6">
          <h2 className="font-wide text-[1.35rem] font-extrabold tracking-[-0.02em]">
            Guardá este enlace
          </h2>
          <p className="mt-2 leading-relaxed text-muted">
            Es la única forma de cancelar el turno vos mismo. Sacale una captura o mandátelo por
            WhatsApp: no te lo vamos a poder mandar por otro lado, porque el consultorio no envía
            mails.
          </p>
          <div className="mt-4">
            <CopyLink href={status.cancelUrl} />
          </div>

          {clinicWhatsapp && (
            <div className="mt-6 border-t border-border pt-5">
              <a
                href={whatsappLink(clinicWhatsapp, confirmationMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border-2 border-accent bg-accent px-5 py-3.5 text-[1.05rem] font-bold text-white transition-[background-color,transform] duration-100 hover:border-accent-hover hover:bg-accent-hover active:translate-y-0.5"
              >
                Guardármelo en WhatsApp
              </a>
              <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">
                Te abre un mensaje con los datos del turno para mandarnos. Así te queda guardado en
                el teléfono y nosotras nos enteramos.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {clinicPhone && (
        <p className="mt-6 text-muted">
          Si preferís, llamanos al{" "}
          <a href={`tel:${clinicPhone}`} className="font-bold text-accent underline underline-offset-4">
            {clinicPhone}
          </a>{" "}
          y lo cancelamos nosotras.
        </p>
      )}
    </div>
  );
}
