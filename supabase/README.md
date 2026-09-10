# Base de datos

## Aplicar el esquema

Sin CLI: abrí el SQL Editor del proyecto en Supabase y ejecutá, en orden:

1. `migrations/0001_init.sql`
2. `migrations/0002_seed.sql`

Con la CLI:

```bash
supabase link --project-ref <ref>
supabase db push
```

## Crear el usuario de Rosa

No hay registro público: el único usuario se crea a mano.

Authentication → Users → Add user (email + contraseña). Después,
Authentication → Providers → Email, desactivá **Enable sign ups** para que
nadie más pueda crearse una cuenta.

## Decisiones que no son obvias leyendo el SQL

- **`appointments_slot_unique`** es un índice único *parcial* sobre `starts_at`
  donde `status <> 'cancelled'`. Es la única defensa contra el doble turno, y es
  a nivel de base: dos reservas simultáneas del mismo horario terminan con un
  error 23505 en la segunda, que la API convierte en un 409. No hay locking en
  la aplicación porque no hace falta.

- **RLS está activo en todo**, pero el navegador nunca habla con Supabase: las
  páginas se renderizan en el servidor. RLS es defensa en profundidad — si
  alguna vez se filtra una clave al bundle, `anon` igual no lee datos de
  pacientes.

- **`motivo`** es un dato sensible (Ley 25.326 art. 2). Nunca sale a `anon`, y
  el cron `/api/cron/retencion` lo borra 30 días después del turno.

- **`rate_limit_hits`** guarda un hash del IP, no el IP. Está en Postgres y no en
  memoria porque en Vercel cada request puede tocar una instancia distinta, así
  que un contador en memoria no limitaría nada.

## Los crons

Configurados en `vercel.json`, en horario UTC:

| Job | Cron (UTC) | Hora en Buenos Aires | Qué hace |
|---|---|---|---|
| `/api/cron/recordatorios` | `0 12 * * *` | 09:00 | Recordatorio a los turnos de mañana. Idempotente vía `reminder_sent_at`. |
| `/api/cron/retencion` | `0 6 * * *` | 03:00 | Borra `motivo` viejo, anonimiza turnos de más de 12 meses, limpia rate limits. |

El plan Hobby de Vercel permite 2 crons diarios, que es exactamente lo que usamos.
Ambos exigen `Authorization: Bearer $CRON_SECRET` y fallan cerrado si no está seteado.
