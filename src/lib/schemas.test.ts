import { describe, expect, it } from "vitest";

import { adminBookingSchema, bookingSchema } from "./booking-schema";
import { fieldErrorsOf, parseForm } from "./forms";
import {
  blockSchema,
  locationSchema,
  loginSchema,
  newPractitionerSchema,
  newServiceSchema,
  serviceSchema,
  settingsSchema,
  shiftSchema,
} from "./schemas";

const ID = "e24f05a5-4259-4d89-a906-9eabe84a8d89";

/** El mensaje de un campo, o null si pasó. */
function errorOf(result: ReturnType<typeof parseForm>, field: string) {
  return result.ok ? null : (result.state.fieldErrors?.[field] ?? null);
}

describe("parseForm", () => {
  it("devuelve un error por campo, no la lista entera", () => {
    const result = parseForm(locationSchema, { name: "", address: "", mapUrl: "ftp://x" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.state.status).toBe("error");
    expect(Object.keys(result.state.fieldErrors ?? {}).sort()).toEqual([
      "address",
      "mapUrl",
      "name",
    ]);
  });

  it("devuelve los datos limpios cuando pasa", () => {
    const result = parseForm(newPractitionerSchema, {
      firstName: "  Ana ",
      lastName: "Gómez",
      title: "",
      slotMinutes: "60",
      specialtyId: ID,
    });
    expect(result.ok && result.data).toEqual({
      firstName: "Ana",
      lastName: "Gómez",
      title: "",
      slotMinutes: 60,
      specialtyId: ID,
    });
  });
});

describe("profesionales", () => {
  const base = { firstName: "Ana", lastName: "Gómez", title: "", slotMinutes: "60", specialtyId: ID };

  it("pide minutos enteros y razonables", () => {
    expect(errorOf(parseForm(newPractitionerSchema, { ...base, slotMinutes: "" }), "slotMinutes")).toBe(
      "Ingresá la duración en minutos",
    );
    expect(errorOf(parseForm(newPractitionerSchema, { ...base, slotMinutes: "abc" }), "slotMinutes")).toBe(
      "Ingresá la duración en minutos",
    );
    expect(errorOf(parseForm(newPractitionerSchema, { ...base, slotMinutes: "2" }), "slotMinutes")).toBe(
      "Tiene que ser de 5 minutos o más",
    );
  });

  it("pide la especialidad en el alta", () => {
    expect(errorOf(parseForm(newPractitionerSchema, { ...base, specialtyId: "" }), "specialtyId")).toBe(
      "Elegí una especialidad",
    );
  });
});

describe("sedes", () => {
  it("acepta el mapa vacío o con https, y nada más", () => {
    const base = { name: "Centro", address: "Mitre 496, Salta" };
    expect(parseForm(locationSchema, { ...base, mapUrl: "" }).ok).toBe(true);
    expect(parseForm(locationSchema, { ...base, mapUrl: "https://maps.app.goo.gl/x" }).ok).toBe(true);
    expect(errorOf(parseForm(locationSchema, { ...base, mapUrl: "maps.google.com" }), "mapUrl")).toBe(
      "Pegá un enlace que empiece con https://",
    );
  });
});

describe("precios", () => {
  it("acepta vacío, enteros y hasta dos decimales", () => {
    for (const price of ["", "12000", "12000.5", "12000.50"]) {
      expect(parseForm(serviceSchema, { name: "Consulta", price, description: "" }).ok).toBe(true);
    }
  });

  it("rechaza lo tipeado con signos o separadores", () => {
    for (const price of ["$12000", "12.000,00", "-5"]) {
      expect(errorOf(parseForm(serviceSchema, { name: "Consulta", price, description: "" }), "price")).toBe(
        "Ingresá el precio en números, sin puntos ni signos",
      );
    }
  });
});

describe("alta de un tratamiento", () => {
  it("limita el texto de «qué es»", () => {
    const base = { name: "Consulta general", price: "", specialtyId: ID };
    expect(errorOf(parseForm(newServiceSchema, { ...base, description: "x".repeat(241) }), "description")).toBe(
      "No puede superar los 240 caracteres",
    );
  });

  it("pide el nombre y la especialidad, y deja el precio vacío", () => {
    const base = { name: "Consulta general", price: "", description: "", specialtyId: ID };
    expect(parseForm(newServiceSchema, base).ok).toBe(true);
    expect(errorOf(parseForm(newServiceSchema, { ...base, name: "" }), "name")).toBe(
      "Ingresá el nombre",
    );
    expect(errorOf(parseForm(newServiceSchema, { ...base, specialtyId: "" }), "specialtyId")).toBe(
      "Elegí una especialidad",
    );
  });
});

describe("agenda", () => {
  const shift = { practitionerId: ID, locationId: ID, weekday: "1", startTime: "08:00", endTime: "12:00" };

  it("marca la hora de fin si no es posterior a la de inicio", () => {
    expect(errorOf(parseForm(shiftSchema, { ...shift, startTime: "12:00", endTime: "10:00" }), "endTime")).toBe(
      "Tiene que ser después de la hora de inicio",
    );
    expect(parseForm(shiftSchema, shift).ok).toBe(true);
  });

  it("acepta sólo horas en punto, de 8 a 23", () => {
    expect(errorOf(parseForm(shiftSchema, { ...shift, startTime: "08:30" }), "startTime")).toBe(
      "Elegí la hora de inicio",
    );
    expect(errorOf(parseForm(shiftSchema, { ...shift, startTime: "07:00" }), "startTime")).toBe(
      "Elegí la hora de inicio",
    );
    expect(parseForm(shiftSchema, { ...shift, startTime: "22:00", endTime: "23:00" }).ok).toBe(true);
  });

  it("marca la fecha de fin si es anterior a la de inicio", () => {
    const block = { practitionerId: "", locationId: "", from: "2026-09-21", to: "2026-09-20", reason: "" };
    expect(errorOf(parseForm(blockSchema, block), "to")).toBe("No puede ser anterior a la fecha de inicio");
    expect(parseForm(blockSchema, { ...block, to: "2026-09-21" }).ok).toBe(true);
  });
});

describe("consultorio e ingreso", () => {
  it("pide el WhatsApp con característica, y lo deja vacío si no hay", () => {
    const base = { clinicName: "Podología Mitre", phone: "" };
    expect(parseForm(settingsSchema, { ...base, whatsapp: "" }).ok).toBe(true);
    expect(parseForm(settingsSchema, { ...base, whatsapp: "387 555-4444" }).ok).toBe(true);
    expect(errorOf(parseForm(settingsSchema, { ...base, whatsapp: "555-4444" }), "whatsapp")).toBe(
      "Ingresá el número con característica, como 387 555-4444",
    );
  });

  it("pide un email con forma de email", () => {
    expect(errorOf(parseForm(loginSchema, { email: "rosa", password: "x" }), "email")).toBe(
      "Ingresá un email válido",
    );
  });
});

describe("la voz de cada formulario", () => {
  it("la reserva le habla al paciente y el panel habla del paciente", () => {
    const vacio = {};
    const publico = bookingSchema.safeParse(vacio);
    const panel = adminBookingSchema.safeParse(vacio);
    expect(publico.success || fieldErrorsOf(publico.error).patientFirstName).toBe("Ingresá tu nombre");
    expect(panel.success || fieldErrorsOf(panel.error).patientFirstName).toBe("Ingresá el nombre");
  });
});
