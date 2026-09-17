---
version: 1
slug: "src-app-turnos-page-tsx"
primary_target: "src/app/turnos/page.tsx"
related_targets: ["src/app/turnos/[slug]/page.tsx","src/components/booking-flow.tsx","src/app/turnos/cancelar/[token]/page.tsx"]
---

# Flujo de turnos (`/turnos`, `/turnos/[slug]`, `/turnos/cancelar/[token]`)

Mode: Operate. Visitor: público general de Salta, casi siempre desde el celular, muchas veces con poca soltura digital. Task: sacar un turno sin llamar ni crear cuenta, y poder cancelarlo después. Estados que importan: sin profesionales, sin horarios en el horizonte, horario tomado mientras completaba (409), error de red, enviando, turno confirmado, enlace ya usado o vencido. Constraints: los datos que se guardan no cambian (nombre, apellido, DNI, obra social, teléfono, motivo opcional, consentimiento); el consentimiento nombra el dato de salud (Ley 25.326); el enlace de cancelación se muestra una vez y no hay mail; disponibilidad siempre fresca (`force-dynamic`).

Alcance confirmado con el usuario: todo el camino del paciente. Permiso confirmado: además de lo visual, se pueden reescribir rótulos, ayudas y mensajes.

Build path: code-led (sin generación de imágenes en esta sesión).

## Direction contract

THESIS: El flujo es el mostrador del consultorio: de un lado el turno que se está armando, siempre a la vista; del otro, una sola pregunta por vez, grande. Rechaza el formulario largo de una pantalla y el wizard que esconde lo ya decidido.

OWN-WORLD: El mundo de la tarjetita, sin cambios: cartulina, tinta de imprenta, renglones y rótulos angostos en versalitas, lo elegido escrito en birome, sello azul para la acción y rojo de numerador para números. Esquinas vivas, sin sombras salvo la tarjeta apoyada.

STORY: El paciente ve desde el primer paso el mismo objeto que vio en el home —su tarjeta— con los renglones en blanco. Elige con quién, cuándo y deja sus datos; cada decisión escribe un renglón. Al confirmar, el sello cae sobre la tarjeta y esa tarjeta es el comprobante con el enlace para cancelar.

FIRST VIEWPORT: En escritorio, columna izquierda fija de 22rem con la tarjeta del turno armándose y debajo lo que falta; a la derecha, "Paso 1 de 3" y la pregunta del momento a tamaño grande con sus opciones. En el teléfono la tarjeta se reduce a una barra fija arriba con lo ya elegido, y la pregunta ocupa la pantalla entera; la acción principal queda visible sin scroll.

FORM: El mostrador, posición 2 de mi lista ordenada, repartida en la segunda mano; seed key 62dd1dd8, re-roll 1. Interacción firma: cada decisión escribe su renglón en la tarjeta con la letra de birome, y al confirmar cae el sello una sola vez.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
