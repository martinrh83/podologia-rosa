"use client";

import { useActionState, useState } from "react";

import { updateLocation } from "@/app/actions/locations";
import { updatePractitioner } from "@/app/actions/practitioners";
import { updateService } from "@/app/actions/schedule";
import { IDLE, type ActionState } from "@/app/actions/state";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { MoneyField, TextField } from "@/components/admin/fields";

/**
 * Las fichas editables de las listas del panel: profesionales, sedes, precios.
 *
 * Eran formularios de servidor sueltos, sin estado: al apretar «Guardar» la
 * página se recargaba y nada decía si había guardado, y un dato inválido se
 * descartaba en silencio. Ahora cada ficha dice «Guardando…» y después
 * «Guardado» o el error, en su propio renglón.
 *
 * Los campos están controlados por lo mismo que las altas: React vacía un
 * formulario no controlado al terminar la acción, y ante un error eso le
 * borraba a Rosa lo que acababa de escribir.
 */
function useEditForm(
  action: (previous: ActionState, formData: FormData) => Promise<ActionState>,
) {
  const [state, formAction] = useActionState(action, IDLE);
  // En cuanto se toca algo, el «Guardado» de antes deja de ser cierto.
  const [dirty, setDirty] = useState(false);
  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    setDirty(false);
  }

  return {
    state,
    formAction,
    onChange: () => setDirty(true),
    hideSaved: dirty && state.status === "saved",
  };
}

function Footer({ state, hidden }: { state: ActionState; hidden: boolean }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <SubmitButton variant="outline" size="sm">
        Guardar cambios
      </SubmitButton>
      <ActionResult state={state} saved="Guardado." hidden={hidden} />
    </div>
  );
}

export function EditPractitionerForm({
  practitioner,
}: {
  practitioner: {
    id: string;
    first_name: string;
    last_name: string;
    title: string | null;
    slot_minutes: number;
  };
}) {
  const { state, formAction, onChange, hideSaved } = useEditForm(updatePractitioner);
  const id = practitioner.id;

  const [firstName, setFirstName] = useState(practitioner.first_name);
  const [lastName, setLastName] = useState(practitioner.last_name);
  const [title, setTitle] = useState(practitioner.title ?? "");
  const [slotMinutes, setSlotMinutes] = useState(String(practitioner.slot_minutes));

  return (
    <form action={formAction} onChange={onChange}>
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`fn-${id}`}
          name="firstName"
          label="Nombre"
          required
          minLength={2}
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
        <TextField
          id={`ln-${id}`}
          name="lastName"
          label="Apellido"
          required
          minLength={2}
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_10rem]">
        <TextField
          id={`ti-${id}`}
          name="title"
          label="Título"
          optional
          hint="Se ve debajo del nombre. Ej: Podóloga · MP 1234"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <TextField
          id={`sm-${id}`}
          name="slotMinutes"
          label="Turno (min)"
          type="number"
          required
          min="5"
          step="5"
          inputMode="numeric"
          value={slotMinutes}
          onChange={(event) => setSlotMinutes(event.target.value)}
        />
      </div>

      <Footer state={state} hidden={hideSaved} />
    </form>
  );
}

export function EditLocationForm({
  location,
}: {
  location: { id: string; name: string; address: string; map_url: string | null };
}) {
  const { state, formAction, onChange, hideSaved } = useEditForm(updateLocation);
  const id = location.id;

  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address);
  const [mapUrl, setMapUrl] = useState(location.map_url ?? "");

  return (
    <form action={formAction} onChange={onChange}>
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <TextField
          id={`n-${id}`}
          name="name"
          label="Nombre"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          id={`a-${id}`}
          name="address"
          label="Dirección"
          required
          minLength={5}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </div>

      <TextField
        id={`m-${id}`}
        name="mapUrl"
        label="Enlace del mapa"
        optional
        type="url"
        className="mt-4"
        value={mapUrl}
        onChange={(event) => setMapUrl(event.target.value)}
      />

      <Footer state={state} hidden={hideSaved} />
    </form>
  );
}

export function EditServiceForm({
  service,
}: {
  service: { id: string; name: string; price: number | null };
}) {
  const { state, formAction, onChange, hideSaved } = useEditForm(updateService);
  const id = service.id;

  const [name, setName] = useState(service.name);
  const [price, setPrice] = useState(service.price === null ? "" : String(service.price));

  return (
    <form action={formAction} onChange={onChange}>
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <TextField
          id={`name-${id}`}
          name="name"
          label="Nombre"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <MoneyField
          id={`price-${id}`}
          name="price"
          label="Precio"
          step="100"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </div>

      <Footer state={state} hidden={hideSaved} />
    </form>
  );
}
