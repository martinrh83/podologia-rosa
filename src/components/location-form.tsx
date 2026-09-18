"use client";

import { useActionState, useState } from "react";

import { createLocation } from "@/app/actions/locations";
import { IDLE } from "@/app/actions/state";
import { ActionResult } from "@/components/admin/action-result";
import { SubmitButton } from "@/components/admin/buttons";
import { TextField } from "@/components/admin/fields";

/** Alta de una sede. Controlado por el mismo motivo que el resto del panel. */
export function NewLocationForm() {
  const [state, formAction] = useActionState(createLocation, IDLE);

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
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <TextField
          id="name"
          label="Nombre"
          required
          hint="Corto, para distinguirla. Ej: Centro."
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          id="address"
          label="Dirección"
          required
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </div>

      <TextField
        id="mapUrl"
        label="Enlace del mapa"
        optional
        type="url"
        hint="Pegá el enlace de Google Maps."
        value={mapUrl}
        onChange={(event) => setMapUrl(event.target.value)}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
        <SubmitButton>Agregar sede</SubmitButton>
        <ActionResult state={state} saved="Listo, ya se le pueden cargar horarios." />
      </div>
    </form>
  );
}
