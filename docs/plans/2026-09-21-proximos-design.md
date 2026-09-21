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
- Con `search`: por cada palabra, un `.or()` con `imatch` sobre
  `patient_first_name`, `patient_last_name` y `patient_phone`. Cada palabra
  tiene que aparecer en alguno, así «maria gomez» encuentra a «Gómez, María».

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
  próximos para «maria»» con la sugerencia «Probá sólo con el apellido, o
  con el teléfono».

### Búsqueda

`sanitizeSearch(q)`: recorta espacios y saca lo que rompería el filtro de
PostgREST (`,`, `(`, `)`, `"`) y los comodines de `like` y de una expresión
regular. Una cadena vacía es «sin búsqueda».

Tildes: la primera idea era `ilike` y dejar las tildes para después, porque
`unaccent` pide una migración. Probándolo, «maria» encontraba a «Mariana» y no
a «María», sin ningún aviso. `searchPattern(word)` lo resuelve sin tocar la
base: abre cada vocal y la ñ en sus variantes (`mar[aáÁ][iíïÍÏ][aáÁ]`) y va a
`imatch`. Las mayúsculas acentuadas van a mano porque, según la intercalación,
`imatch` puede no plegar Á/á.

## Menú

En `admin-nav.tsx`, `DAY` suma `{ href: "/admin/proximos", label: "Próximos" }`
entre Mañana y Nuevo turno, y la grilla pasa de `grid-cols-3` a `grid-cols-4`.
Las pestañas pierden `whitespace-nowrap`: en un teléfono de 360 px «Nuevo
turno» se parte en dos renglones dentro de su `min-h-12`. Por debajo de 360 px
la letra baja un poco para que «Próximos» entre.

## Pruebas

Vitest, sólo lógica pura, como los `src/lib/*.test.ts`:

- `groupByLocalDay`: agrupa, respeta el orden, y un turno de la noche que
  cruza la medianoche UTC queda en su día local.
- `sanitizeSearch`: recorte, caracteres sacados, vacío como «sin búsqueda».
- `searchPattern`: «maria» encuentra «María», «alvarez» a «Álvarez», «munoz»
  a «Muñoz», y «maria» no encuentra «Mario».

A mano en la app: las cuatro pestañas en un ancho de teléfono, y la búsqueda
combinada con el filtro por profesional.
