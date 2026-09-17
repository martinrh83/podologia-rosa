/**
 * Las preguntas frecuentes.
 *
 * EN EL CÓDIGO Y NO EN LA BASE, a diferencia de casi todo lo demás del sitio.
 *
 * El criterio del proyecto no es "todo editable" sino: datos operativos en la
 * base, prosa en el código. Los precios cambian con la inflación, los horarios
 * cuando Rosa reorganiza la semana, un profesional se da de alta un martes —
 * eso no puede depender de un deploy. Un FAQ es texto, igual que el titular del
 * home o la política de privacidad, que tampoco son editables y nadie lo
 * discutió.
 *
 * Además: escribir una respuesta buena es redacción, no carga de datos; y el
 * texto que pasa por un PR lo lee alguien antes de publicarse, cosa que un
 * textarea del panel no garantiza. Para un consultorio diciendo cosas sobre
 * tratamientos, eso importa.
 *
 * Se da vuelta si algún día Rosa pide cambios seguido, o si cada especialidad
 * necesita el suyo. Eso se sabe por la frecuencia real, no adivinando.
 *
 * NADA DE HORARIOS ACÁ. Los horarios salen de `weekly_schedule`: el hero los
 * resume y el detalle se ve al sacar turno. Un texto fijo sobre datos que
 * cambian es una mentira con fecha de vencimiento.
 *
 * BORRADOR: la respuesta de medios de pago es inventada y hay que confirmarla
 * con Rosa antes de publicar. Las otras salen de cómo funciona el sitio: la
 * reserva describe el flujo de /turnos, y las obras sociales son las opciones
 * del formulario (`COVERAGES` en `booking-schema.ts`).
 */
export type FaqItem = { question: string; answer: string };

export const FAQ: FaqItem[] = [
  {
    question: "¿Cómo funciona la reserva?",
    answer:
      "Tocás «Sacar turno», elegís con quién te querés atender y el día y horario que te " +
      "quede cómodo. Después completás tu nombre, DNI, obra social y teléfono, y listo: " +
      "no hace falta crear una cuenta ni llamar. Al terminar te mostramos el enlace de tu " +
      "turno; guardalo, porque desde ahí lo podés cancelar.",
  },
  {
    question: "¿Qué obras sociales atienden?",
    answer:
      "Atendemos por IPS y OSUNSa. Si no tenés obra social o tenés otra, podés atenderte " +
      "como particular: lo elegís al reservar.",
  },
  {
    question: "¿Cuáles son los medios de pago?",
    answer:
      "Podés pagar en el consultorio con efectivo, transferencia o tarjeta de débito. " +
      "Por ahora no aceptamos tarjeta de crédito.",
  },
  {
    question: "¿Cómo cancelo si no puedo ir?",
    answer:
      "Con el enlace que te mostramos al terminar la reserva: desde ahí lo cancelás en un " +
      "clic. Guardalo con una captura o mandátelo por WhatsApp, porque no enviamos mails. " +
      "Si lo perdiste, llamanos y lo cancelamos nosotras. Avisar libera el horario para " +
      "otra persona.",
  },
];
