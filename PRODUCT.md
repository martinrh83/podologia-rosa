# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Pacientes (sitio público).** Público general de Salta: cualquier adulto con un
problema puntual de los pies o que viene a control. No hay un perfil dominante,
así que el sitio no puede asumir ni soltura digital ni lo contrario. Entran para
sacar un turno, ver si atienden por su obra social, dónde queda la sede y cuándo
atienden. Antes de este sitio todo turno era por teléfono.

**Personal (panel `/admin`).** Rosa y la recepción. Cargan turnos que entran por
teléfono, miran el día de hoy y el de mañana, mandan los recordatorios por
WhatsApp y mantienen profesionales, sedes, horarios y datos del consultorio. El
panel se usa mucho desde el celular, a menudo en medio de la atención.

## Product Purpose

El sitio del consultorio **Podología Mitre** con turnos online. El paciente elige
profesional, día y horario y el turno queda confirmado al instante, sin crear
cuenta y sin llamar. El personal administra la agenda desde el panel.

Existe para sacar el teléfono del medio: menos interrupciones durante la consulta,
y no perder pacientes que no quieren o no pueden llamar. También para que el
consultorio aparezca en búsquedas locales ("podología Salta", "pie diabético
Salta", el nombre de una profesional).

Éxito: el paciente saca el turno solo, de punta a punta, y el personal casi no
atiende llamadas para reservar.

## Positioning

Confirmados como lo que distingue al consultorio:

- **Turno online sin llamar.** Un minuto, sin cuenta, confirmado al instante.
- **Obras sociales.** Atienden por IPS y OSUNSa, además de particular.
- **Ubicación céntrica.** Sede en pleno centro de Salta Capital (Bartolomé Mitre
  496), con una segunda sede en San José (Olavarría 1130).

"Atendemos de a una persona por vez, sin apuro" está hoy en el copy de
Profesionales, pero no se confirmó como diferencial.

## Operating Context

- **Consultorio de varias podólogas al mismo nivel.** Ninguna es "la cara" de la
  marca; Rosa administra, pero la marca pública es Podología Mitre y no una
  persona. Cada profesional tiene su propia agenda y su URL de reserva
  (`/turnos/[slug]`).
- **Dos sedes.** Cada franja del horario semanal dice en qué sede se atiende.
- **Sin mails.** El consultorio no tiene dominio propio. El enlace para cancelar
  se muestra en pantalla al terminar la reserva; los recordatorios los manda el
  personal a mano por WhatsApp desde `/admin/manana`.
- **Turnos por teléfono** entran por el mismo circuito que los online, así que la
  disponibilidad pública se corrige sola.
- **Zona horaria** `America/Argentina/Salta`.

## Capabilities and Constraints

- **Reserva pública:** profesional → día y horario → nombre, apellido, DNI, obra
  social (IPS, OSUNSa o particular), teléfono, motivo opcional y consentimiento.
  Horizonte de 15 días; límite de intentos por IP. El personal puede cargar
  cualquier fecha.
- **Duración del turno:** 60 minutos, igual para todos los tratamientos, con la
  limpieza incluida. Los turnos van pegados a propósito.
- **Cancelación** por enlace con token, sin cuenta.
- **Panel:** hoy, mañana, nuevo turno, agenda y bloqueos, profesionales, sedes,
  especialidades, precios, datos del consultorio.
- **Precios:** se guardan y se editan en el panel como referencia interna, pero
  **no se publican**. Se informan en la consulta.
- **Datos sensibles (Ley 25.326):** el motivo de consulta es dato de salud. Nunca
  sale a un usuario anónimo, se borra a los 30 días, y los datos de contacto se
  anonimizan al año. Cualquier lugar nuevo que lo muestre tiene que coincidir con
  lo que promete `/privacidad`.
- **Privacidad de terceros:** sin Google Maps ni scripts de terceros que se enteren
  de cada visita. Los mapas son SVG propios hechos con OpenStreetMap.
- **Stack:** Next.js (App Router, versión con cambios incompatibles, ver
  `AGENTS.md`) + Supabase, todo renderizado en el servidor. El navegador nunca
  habla con Supabase. Deploy en Vercel.
- **Contenido:** los datos operativos (horarios, profesionales, sedes, servicios)
  viven en la base; la prosa (titulares, FAQ, privacidad) vive en el código y
  pasa por PR.
- **Vocabulario:** castellano rioplatense con voseo. "Turno" y "sacar un turno",
  nunca "cita" o "reservar una cita". "Podóloga", "consultorio", "obra social".

## Brand Commitments

- Nombre público: **Podología Mitre** ("Podología Mitre Salta" en el título).
- Isotipo propio (`public/logo.svg`, `src/components/logo.tsx`), un solo trazado
  que toma el color del texto.
- Voz directa y cercana, sin vueltas, en voseo. Ejemplo vigente: "Cuidamos tus
  pies, sin vueltas."

## Evidence on Hand

- **Confirmado que existe, todavía no está en el repo:** retratos de las
  profesionales, fotos del consultorio (sedes, box o fachada), números de
  matrícula y biografías reales. Hasta que lleguen, las fotos son una silueta de
  relleno (`public/team/team-placeholder.webp`) y las fotos van en
  `public/team/<slug>.webp`, en 4:5.
- **Medios de pago confirmados:** efectivo, transferencia y tarjeta de débito; no
  tarjeta de crédito. (El comentario de `src/lib/faq.ts` todavía la marca como
  borrador.)
- **Mapas** de las dos sedes en `public/maps/`.
- **No hay:** testimonios, reseñas, cifras de pacientes, prensa ni premios. No
  inventarlos.

## Product Principles

1. **Sacar turno le gana a todo.** Cada pantalla pública acerca al turno o
   contesta algo que frena a alguien antes de reservar.
2. **Lo que cambia sale de la base.** Horarios, sedes y profesionales nunca van
   escritos a mano en el copy: un texto fijo sobre datos que cambian es una
   mentira con fecha de vencimiento.
3. **No prometer lo que no es cierto.** Nada de coberturas genéricas, precios
   desactualizados ni afirmaciones de una sede que no valen para la otra.
4. **Cero fricción para cualquiera.** Sin cuentas, sin mails, con alternativas
   visibles (llamar, WhatsApp) para quien prefiere no reservar online.
5. **El dato de salud se cuida más que el resto.**

## Accessibility & Inclusion

No se fijó un estándar formal. Como el público es general y reserva sin ayuda,
el flujo de `/turnos` tiene que funcionar para quien usa poco el celular. El panel
tiene que poder usarse con una mano desde un teléfono.
