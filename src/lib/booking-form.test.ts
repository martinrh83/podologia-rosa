import { describe, expect, it } from "vitest";

import {
  EMPTY_FORM,
  FIELD_ORDER,
  firstInvalidField,
  validateField,
  validateForm,
  type PatientForm,
} from "./booking-form";
import { bookingSchema } from "./booking-schema";

const completo: PatientForm = {
  patientFirstName: "Ana",
  patientLastName: "Gómez",
  patientDni: "20.123.456",
  patientCoverage: "ips",
  patientPhone: "+54 9 387 555-4444",
  motivo: "",
  consent: true,
};

describe("validateField", () => {
  it("acepta un formulario completo", () => {
    for (const field of FIELD_ORDER) {
      expect(validateField(field, completo)).toBeNull();
    }
  });

  it("devuelve el mensaje del schema, no uno propio", () => {
    // Es el punto de todo el módulo: las reglas y los textos salen de
    // `bookingSchema`, el mismo que aplica el servidor. Si alguien cambia el
    // mensaje ahí, cambia acá solo.
    const issue = bookingSchema.shape.patientDni.safeParse("123");
    expect(issue.success).toBe(false);

    expect(validateField("patientDni", { ...completo, patientDni: "123" })).toBe(
      issue.success ? null : issue.error.issues[0]?.message,
    );
  });

  it("exige el consentimiento, que el schema no valida", () => {
    // `bookingSchema` sólo pide un boolean: un turno cargado por Rosa desde el
    // panel no necesita consentimiento. La regla del formulario público es más
    // estricta, y tiene que coincidir con la de `createBooking`.
    expect(bookingSchema.shape.consent.safeParse(false).success).toBe(true);
    expect(validateField("consent", { ...completo, consent: false })).not.toBeNull();
  });

  it("deja pasar el motivo vacío, que es opcional", () => {
    expect(validateField("motivo", { ...completo, motivo: "" })).toBeNull();
    expect(validateField("motivo", { ...completo, motivo: "x".repeat(501) })).not.toBeNull();
  });

  it("no acepta una obra social que el consultorio no atiende", () => {
    expect(validateField("patientCoverage", { ...completo, patientCoverage: "osde" })).toBe(
      "Elegí tu obra social",
    );
  });
});

describe("validateForm", () => {
  it("marca todos los campos de un formulario vacío menos el motivo", () => {
    const errores = validateForm(EMPTY_FORM);

    expect(Object.keys(errores).sort()).toEqual(
      FIELD_ORDER.filter((field) => field !== "motivo").sort(),
    );
  });

  it("no devuelve nada cuando está todo bien", () => {
    expect(validateForm(completo)).toEqual({});
  });
});

describe("firstInvalidField", () => {
  it("elige el de más arriba en pantalla, no el primero del objeto", () => {
    // Si devolviera cualquiera, el foco saltaría a un campo del medio y la
    // persona no vería los errores de arriba.
    const errores = validateForm({
      ...EMPTY_FORM,
      patientFirstName: "Ana",
      patientLastName: "Gómez",
      consent: true,
    });

    expect(firstInvalidField(errores)).toBe("patientDni");
  });

  it("devuelve null cuando no hay errores", () => {
    expect(firstInvalidField({})).toBeNull();
  });
});
