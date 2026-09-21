"use client";

import { useActionState, useState } from "react";

import { createService } from "@/app/actions/schedule";
import { SubmitButton } from "@/components/admin/buttons";
import { sent, withToast } from "@/components/admin/with-toast";
import { MoneyField, SelectField, TextArea, TextField } from "@/components/fields";
import { FormAlert } from "@/components/form-alert";
import { useForm } from "@/components/use-form";
import { IDLE } from "@/lib/forms";
import { newServiceSchema } from "@/lib/schemas";

/**
 * Alta de un tratamiento.
 *
 * Faltaba: la pantalla de precios editaba y ocultaba, pero los cinco
 * tratamientos que había venían de la semilla. Cuando `0016` los sacó de las
 * migraciones —el consultorio los edita, no son parte del esquema— no quedó
 * forma de cargar ninguno, y en una base nueva "Tratamientos" no existe.
 *
 * El precio es de referencia interna y no se publica; se dice en el campo, no
 * en una bajada, porque es la única duda que genera esta pantalla.
 *
 * La especialidad se elige sólo cuando hay más de una: con una sola, la
 * pregunta tiene una sola respuesta posible.
 */
export type ServiceFormSpecialty = { id: string; name: string };

export function NewServiceForm({ specialties }: { specialties: ServiceFormSpecialty[] }) {
  const [state, formAction] = useActionState(
    withToast(createService, (data) => `${sent(data, "name")} agregado a Tratamientos.`),
    IDLE,
  );
  const form = useForm(
    newServiceSchema,
    { name: "", price: "", description: "", specialtyId: specialties[0]?.id ?? "" },
    state,
  );

  // Después de guardar queda listo para el siguiente, con la especialidad
  // elegida: los tratamientos se cargan de a varios, casi siempre de la misma.
  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    if (state.status === "saved") form.reset({ ...form.values, name: "", price: "", description: "" });
  }

  return (
    <form action={formAction} onSubmit={form.onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <TextField id="name" label="Nombre" required {...form.field("name")} />
        <MoneyField id="price" label="Precio" step="100" {...form.field("price")} />
      </div>

      <TextArea
        id="description"
        label="Qué es"
        optional
        rows={2}
        hint="Se lee abajo del nombre en Tratamientos. Ej: «Uña encarnada: alivio del dolor y seguimiento hasta que crezca bien.»"
        {...form.field("description")}
      />

      {specialties.length > 1 ? (
        <SelectField id="specialtyId" label="Especialidad" {...form.field("specialtyId")}>
          {specialties.map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {specialty.name}
            </option>
          ))}
        </SelectField>
      ) : (
        <input type="hidden" name="specialtyId" value={form.values.specialtyId} />
      )}

      <FormAlert state={state} />

      <div className="pt-2">
        <SubmitButton>Agregar tratamiento</SubmitButton>
      </div>
    </form>
  );
}
