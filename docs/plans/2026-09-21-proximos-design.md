# Próximos: ver todos los turnos que vienen

## El problema

El panel sólo muestra dos días: **Hoy** (`/admin`) y **Mañana** (`/admin/manana`).
No hay forma de ver un día posterior, la semana, ni encontrar el turno de un
paciente sin saber la fecha. La nota de «Cerrar días» en Agenda pide revisar los
turnos de esos días, y no hay dónde.

Las preguntas reales que tienen que tener respuesta:

- ¿Cómo viene la semana?
- ¿Qué hay el día X?
- ¿Cuándo es el turno de María?

Mirar para atrás (turnos pasados) queda fuera.

Hoy hay menos de 40 turnos reservados a futuro: una lista agrupada por día se
lee entera sin paginar.

## La decisión

Una pantalla nueva, **Próximos** (`/admin/proximos`), con todos los turnos desde
hoy, agrupados por día, con el filtro por profesional y una búsqueda por nombre
o teléfono.

Descartadas:

- **Selector de día en Hoy**: resuelve «el día X», pero ver la semana obliga a
  pasar siete días, y la búsqueda igual necesita su lugar.
- **Vista semanal**: en el teléfono queda apretada, y con este volumen es más
  estructura de la que piden los datos.

## Datos

`getUpcomingAppointments({ practitionerId, search })` en
`src/lib/db/appointments.ts`, junto a `getAppointmentsForLocalDay`:

- Mismo `select` (profesional y sede) y mismo orden por `starts_at`.
- `starts_at >= inicio de hoy` (local), con `localDayRange(new Date()).start`.
  Todo hoy y no «desde ahora», para que los de la mañana se vean como Atendido
  o No vino.
- Sin cancelados, como en Hoy.
- Sin fecha tope. Si el volumen crece, un `limit` es una línea.
- Con `search`: `.or()` con `ilike` sobre `patient_first_name`,
  `patient_last_name` y `patient_phone`.

## Pantalla

`src/app/admin/proximos/page.tsx`, componente de servidor con la forma de Hoy y
Mañana: `requireStaff()`, `dynamic = "force-dynamic"`, `robots` noindex.

- `PageHeading title="Próximos"`.
- Búsqueda: un `<form>` GET con `<input name="q">` y botón «Buscar». Un input
  oculto conserva `profesional`. Sin JavaScript, igual que el filtro: la URL se
  comparte y el botón de atrás funciona.
- `PractitionerFilter basePath="/admin/proximos"`, con una prop nueva para
  conservar `q` en sus links.
- Los turnos se agrupan con `groupByLocalDay()`, que usa `toLocalDateKey` para
  que un turno de las 20 h no caiga en el día UTC siguiente. Cada grupo lleva
  un `SectionHeading` con `capitalizeFirst(formatDay(...))`; los de hoy y
  mañana, una marca «Hoy» / «Mañana».
- Cada turno es el `AppointmentCard` de siempre.
- Con búsqueda: «N turnos para «maria»» y un link «Limpiar».
- Vacío: `Notice tone="muted"` «No hay turnos próximos», o «No hay turnos
  próximos para «maria»» con la sugerencia «Probá sin tildes o con el
  teléfono».

### Búsqueda

`sanitizeSearch(q)`: recorta espacios y saca `%`, `,`, `(` y `)`, que romperían
el filtro de PostgREST. Una cadena vacía es «sin búsqueda».

`ilike` no ignora tildes: «maria» no encuentra «María». Resolverlo pide
`unaccent` en la base, o sea una migración. Queda fuera de esta versión; el
mensaje de vacío lo avisa.

## Menú

En `admin-nav.tsx`, `DAY` suma `{ href: "/admin/proximos", label: "Próximos" }`
entre Mañana y Nuevo turno, y la grilla pasa de `grid-cols-3` a `grid-cols-4`.
En un teléfono de 360 px «Nuevo turno» se parte en dos renglones; la pestaña
tiene `min-h-12` y `leading-tight`, así que entra.

## Pruebas

Vitest, sólo lógica pura, como los `src/lib/*.test.ts`:

- `groupByLocalDay`: agrupa, respeta el orden, y un turno de la noche que
  cruza la medianoche UTC queda en su día local.
- `sanitizeSearch`: recorte, caracteres sacados, vacío como «sin búsqueda».

A mano en la app: las cuatro pestañas en un ancho de teléfono, y la búsqueda
combinada con el filtro por profesional.
