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
 * LOS MONTOS DE IPS SON LA EXCEPCIÓN, y son deuda. Los descartables ($25.000 /
 * $27.200) están escritos acá porque Rosa los dictó como parte de la respuesta,
 * pero son precios: la inflación los vence y actualizarlos pide un PR, cuando
 * todos los demás precios del sitio se editan en /admin/servicios. Si quedan,
 * hay que revisarlos cada vez que cambian los de la lista.
 *
 * NADA DE HORARIOS ACÁ. Los horarios salen de `weekly_schedule`: el hero los
 * resume y el detalle se ve al sacar turno. Un texto fijo sobre datos que
 * cambian es una mentira con fecha de vencimiento.
 *
 * BORRADOR: la respuesta de medios de pago es inventada y hay que confirmarla
 * con Rosa antes de publicar. La recomendación previa la dio Rosa. Las otras salen de
 * cómo funciona el sitio: la reserva describe el flujo de /turnos, y las obras
 * sociales son las opciones del formulario (`COVERAGES` en `booking-schema.ts`).
 */
export type FaqItem = { question: string; answer: string };

export const FAQ: FaqItem[] = [
  {
    question: "¿Cómo funciona la reserva?",
    answer:
      "Para reservar siga los pasos indicados. Al terminar le mostramos la información de " +
      "su reserva, que debe guardar en su WhatsApp.",
  },
  {
    question: "¿Existe alguna recomendación antes de asistir a la consulta?",
    answer: "Debe asistir a su turno de podología con las uñas sin esmaltar.",
  },
  {
    question: "¿Qué obras sociales atienden?",
    answer:
      "Atendemos por IPS y OSUNSa. Si no tiene obra social o tiene otra, puede atenderse " +
      "como particular: lo elige al reservar.",
  },
  {
    question: "¿Cómo trabajan con IPS?",
    answer:
      "Puede traer la derivación de su médico o, si no la tiene, le hacemos la validación " +
      "de la orden online acá en el consultorio: en ese momento se sabe el valor de la " +
      "orden. Todo se autoriza acá, no necesita hacer trámites antes. Usted abona los " +
      "descartables: $25.000 si tiene coseguro y $27.200 si no lo tiene. Según lo que " +
      "determine la obra social, puede pedirse además la orden médica.",
  },
  {
    question: "¿Cómo trabajan con OSUNSa?",
    answer:
      "Antes del turno pase por la recepción del consultorio a retirar el pedido de " +
      "atención y autorícelo en su obra social. El día de la atención traiga el pedido ya " +
      "autorizado.",
  },
  {
    question: "¿Cuáles son los medios de pago?",
    answer:
      "Puede pagar en el consultorio con efectivo, transferencia o tarjeta de débito. " +
      "Por ahora no aceptamos tarjeta de crédito.",
  },
  {
    question: "¿Cómo cancelo si no puedo ir?",
    answer:
      "Con el enlace que le mostramos al terminar la reserva: desde ahí lo cancela en un " +
      "clic. Para cancelar o cambiar el turno tiene que avisar con 12 horas de " +
      "anticipación. Guarde ese enlace con una captura o mándeselo por WhatsApp, porque " +
      "no enviamos mails. Si lo perdió, llámenos y lo cancelamos nosotras. Avisar libera " +
      "el horario para otra persona.",
  },
];
