# Podología Rosa

Sitio del consultorio con turnos online. Next.js (App Router) + Supabase.

Los pacientes sacan turno sin crear cuenta; Rosa administra la agenda desde el
panel. No hay backend aparte: los route handlers de Next son el servidor.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar con los datos reales
npm run dev
```

Sin las variables de Supabase el sitio devuelve 500 con un mensaje que dice
exactamente qué falta. Ver `supabase/README.md` para crear el esquema y el
usuario de Rosa.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Tests del motor de horarios y validaciones |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run lint` | ESLint |
| `npm run build` | Build de producción |

## Cómo está armado

```
src/lib/slots.ts          El motor de disponibilidad. Función pura, sin I/O.
src/lib/availability.ts   El I/O alrededor de slots.ts.
src/lib/booking.ts        Crear y cancelar turnos. Lo usan el form y el admin.
src/app/api/turnos        Endpoint público de reserva.
src/app/api/cron          Recordatorios y retención de datos.
src/app/admin             Panel de Rosa (hoy, mañana, nuevo turno).
supabase/migrations       Esquema y datos iniciales.
```

### Decisiones que conviene conocer antes de tocar el código

- **`slots.ts` es puro a propósito.** Toda la aritmética de horarios y zona
  horaria vive ahí sin base de datos ni reloj ambiente, que es lo que permite
  testear los casos borde sin levantar nada. Si agregás lógica de
  disponibilidad, va ahí y con test.

- **El doble turno lo resuelve Postgres, no la aplicación.** Un índice único
  parcial sobre `starts_at` hace que la segunda reserva simultánea falle con
  23505, que la API traduce a 409. No agregues locking en la aplicación.

- **El navegador nunca habla con Supabase.** Todo se renderiza en el servidor.
  RLS está activo igual, como defensa en profundidad.

- **`audience: "public" | "admin"`** es lo que distingue el horizonte de 15 días
  y el tope por contacto (público) de la libertad total de Rosa (admin). Los
  turnos de teléfono entran por el mismo `createBooking`, así que la
  disponibilidad online se corrige sola.

- **Zona horaria:** todo se guarda en UTC y se formatea en
  `America/Argentina/Buenos_Aires` con zona IANA, nunca con un offset fijo.

- **`motivo` es un dato sensible** (Ley 25.326). No sale nunca a `anon` y lo
  borra el cron de retención a los 30 días. Si lo exponés en algún lugar nuevo,
  revisá `/privacidad`, que le promete al paciente exactamente eso.

## Pendiente antes de publicar

- [ ] Confirmar con Rosa la duración real del turno (`clinic_settings.slot_minutes`).
      Todo el motor asume una sola duración.
- [ ] Cargar horarios, servicios y precios reales.
- [ ] Reemplazar el texto de `/sobre-mi` y agregar matrícula.
- [ ] Verificar el dominio en Resend, o los mails caen en spam.
- [ ] Crear el usuario de Rosa y desactivar sign-ups en Supabase.
