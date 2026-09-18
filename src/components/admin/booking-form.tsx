"use client";

import { useActionState, useState } from "react";

import { createAdminBooking } from "@/app/actions/appointments";
import { SubmitButton } from "@/components/admin/buttons";
import { FieldError, Legend, OptionGroup, TextArea, TextField } from "@/components/fields";
import { FormAlert } from "@/components/form-alert";
import { useForm } from "@/components/use-form";
import { adminBookingSchema, COVERAGES, type Coverage } from "@/lib/booking-schema";
import { IDLE } from "@/lib/forms";

export type AdminSlot = { value: string; time: string; location?: string };

/**
 * El turno que se carga desde el mostrador o por teléfono.
 *
 * LOS HORARIOS SON FICHAS
 *
 *   Eran un `<select>`: abrir la lista, correrla, elegir, cerrarla. Con el
 *   paciente enfrente, una grilla de fichas —las mismas de la reserva pública—
 *   deja ver el día entero de un vistazo y se elige de un toque. Y ya no viene
 *   ningún horario elegido de antemano: el `<select>` arrancaba en el primero,
 *   y un turno guardado sin mirar la hora quedaba en el primero del día.
 *
 * LO ESCRITO NO SE PIERDE
 *
 *   Los campos están controlados y el error vuelve como estado, no como una
 *   redirección: antes cualquier rechazo —el DNI mal tipeado, el horario que
 *   alguien tomó online un segundo antes— volvía con el formulario en blanco.
 *   También sobreviven a cambiar de día o de profesional arriba, que es justo
 *   lo que se hace cuando el horario pedido no está.
 *
 * Valida con `adminBookingSchema`: las reglas de la reserva pública, con los
 * mensajes dichos por la recepción. El horario que se ocupó mientras tanto
 * vuelve como error de la grilla, que es donde hay que elegir otro.
 */
export function AdminBookingForm({
  practitionerId,
  dateKey,
  slots,
}: {
  practitionerId: string;
  dateKey: string;
  slots: AdminSlot[];
}) {
  const [state, formAction] = useActionState(createAdminBooking, IDLE);
  const form = useForm(
    adminBookingSchema,
    {
      practitionerId,
      startsAt: "",
      patientFirstName: "",
      patientLastName: "",
      patientDni: "",
      patientCoverage: "particular" as Coverage,
      patientPhone: "",
      motivo: "",
      // El consentimiento es del paciente que reserva solo; en el panel no se pide.
      consent: true,
    },
    state,
  );

  // React vacía el formulario al terminar la acción. A los campos de texto
  // controlados les vuelve a poner su valor, pero a los radios no: quedaban
  // como en el primer render —sin horario, «Particular»— aunque el estado
  // dijera otra cosa. Después de cada respuesta se vuelven a montar, y nacen
  // con la opción que corresponde.
  const [attempt, setAttempt] = useState(0);
  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    setAttempt((value) => value + 1);
  }

  // Si se cambió de día, el horario elegido antes ya no está en la grilla: se
  // suelta, así el formulario no manda uno que ya no se ve.
  const selected = slots.find((slot) => slot.value === form.values.startsAt);
  if (form.values.startsAt && !selected) form.set("startsAt", "");

  const slotError = form.errors.startsAt;

  return (
    <form
      action={formAction}
      onSubmit={form.onSubmit}
      noValidate
      className="space-y-6 border-t-2 border-foreground pt-6"
    >
      {/* El profesional y el día viajan con el turno: son los que definen la
          grilla de horarios, y son a los que se vuelve después de guardar. */}
      <input type="hidden" name="practitionerId" value={practitionerId} />
      <input type="hidden" name="fecha" value={dateKey} />

      <fieldset
        key={`horario-${attempt}`}
        aria-describedby="startsAt-error"
        aria-invalid={slotError ? true : undefined}
      >
        <Legend>Horario</Legend>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {slots.map((slot) => {
            const isSelected = slot.value === selected?.value;
            return (
              <label
                key={slot.value}
                className={`flex min-h-14 cursor-pointer flex-col items-center justify-center border-2 px-2 py-2.5 text-center transition-[background-color,border-color,transform] duration-100 active:translate-y-0.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : slotError
                      ? "border-[color:var(--danger)] bg-surface hover:border-accent"
                      : "border-border bg-surface hover:border-accent"
                }`}
              >
                <input
                  type="radio"
                  name="startsAt"
                  value={slot.value}
                  checked={isSelected}
                  onChange={() => form.set("startsAt", slot.value)}
                  className="sr-only"
                />
                <span className="text-[1.15rem] font-bold tabular-nums">{slot.time}</span>
                {slot.location && (
                  <span
                    className={`font-narrow text-[0.75rem] font-bold uppercase tracking-[0.08em] ${
                      isSelected ? "text-white/85" : "text-accent"
                    }`}
                  >
                    {slot.location}
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <FieldError id="startsAt-error" message={slotError} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="patientFirstName" label="Nombre" required {...form.field("patientFirstName")} />
        <TextField id="patientLastName" label="Apellido" required {...form.field("patientLastName")} />
        <TextField
          id="patientDni"
          label="DNI"
          required
          inputMode="numeric"
          {...form.field("patientDni")}
        />
        <TextField
          id="patientPhone"
          label="Teléfono"
          type="tel"
          required
          inputMode="tel"
          {...form.field("patientPhone")}
        />
      </div>

      <OptionGroup
        key={`cobertura-${attempt}`}
        id="patientCoverage"
        legend="Obra social"
        name="patientCoverage"
        options={COVERAGES}
        value={form.values.patientCoverage}
        error={form.errors.patientCoverage}
        onChange={(value) => form.set("patientCoverage", value)}
      />

      <TextArea
        id="motivo"
        label="Motivo"
        optional
        rows={2}
        maxLength={500}
        {...form.field("motivo")}
      />

      <FormAlert state={state} />

      <SubmitButton block pendingLabel="Guardando…">
        {selected ? `Guardar turno · ${selected.time}` : "Guardar turno"}
      </SubmitButton>
    </form>
  );
}
