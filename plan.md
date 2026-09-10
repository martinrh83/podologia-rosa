# Podología Rosa — sistema de turnos online

## Context

Rosa is a podiatrist in Argentina running a single-practitioner practice. Today all
turnos are taken by phone, which costs her interruptions during consultations and
loses patients who won't call. She has no website, so she also gets no search traffic.

We're building a small clinic website with online booking: patients pick a free slot
and confirm instantly without creating an account, Rosa manages her schedule and phone
bookings from a mobile-friendly admin, and both sides get email notifications. Stakes
are low — Rosa is family, a bug means a phone call, not a lost business — so the plan
optimises for shipping something reliable and maintainable over enterprise robustness.

**Non-goal:** this deliberately rejects off-the-shelf SaaS (Cal.com, Booksy). That was
considered and declined; building it is part of the point.

### Decisions already settled (from the interview)

| Decision | Choice |
|---|---|
| Frontend | React via **Next.js App Router** (not Vite — SSR is needed for local SEO) |
| Backend | **No separate backend app.** Next.js route handlers + Supabase Postgres |
| Patient accounts | None. Anonymous booking |
| Confirmation | Instant. No approval step |
| Cancellation | Unguessable token link in the confirmation email |
| Appointment length | **One fixed duration** — ⚠️ confirm the number with Rosa |
| Availability | Editable weekly schedule + one-off blocks, both managed by Rosa |
| Phone bookings | Rosa enters them in the admin, same table as online turnos |
| Notifications | Email (patient + Rosa) + 24 h reminder cron. WhatsApp via `wa.me` links Rosa taps |
| Locale | Argentina, Spanish only, `America/Argentina/Buenos_Aires` |
| Public booking horizon | 15 days + max 2 active turnos per contact. Rosa unlimited |
| Prices | Stored in DB, edited by Rosa (inflation-proof) |
| Testing | Vitest on the slot engine + a concurrency test. Manual elsewhere |

### Vocabulary (matters for all UI copy)

Argentine Spanish: **turno** (not "cita"), "**sacar un turno**" (not "reservar"),
**podóloga**, **consultorio**. Voseo where natural. Phone format `+54 9 …`.

---

## Step 0 — Accounts (do this first; DNS can stall a day)

1. Register a domain (`.com.ar` or `.com`).
2. Create a Supabase project (free tier), region São Paulo — closest to AR.
3. Create a Resend account, add the domain, set the DNS records, **wait for verification**.
4. Create a Vercel project (Hobby tier — supports one daily cron, which is all we need).

Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (server-only, never in a client component),
`RESEND_API_KEY`, `CRON_SECRET`, `ADMIN_EMAIL`.

---

## Data model (Supabase / Postgres)

All timestamps `timestamptz`, stored UTC, formatted in `America/Argentina/Buenos_Aires`
at the edges only.

- **`clinic_settings`** — singleton row: `slot_minutes`, `horizon_days` (15),
  `max_active_per_contact` (2), clinic name, address, phone, whatsapp number, map URL.
  Editable by Rosa so the horizon and slot length are never a redeploy.
- **`services`** — `name`, `description`, `price`, `display_order`, `active`.
  **Display-only** — services do not affect slot length. Rosa edits prices here.
- **`weekly_schedule`** — `weekday` (0–6), `start_time`, `end_time`.
  *Multiple rows per weekday* so a split shift (9–13 and 16–20) is two rows.
- **`schedule_blocks`** — `starts_at`, `ends_at`, `reason`. Holidays, vacations, ad-hoc.
- **`appointments`** — `starts_at`, `ends_at`, `status`
  (`booked | cancelled | completed | no_show`), `patient_name`, `patient_phone`,
  `patient_email`, `motivo` (nullable), `consent_at`, `source` (`online | admin`),
  `cancel_token` (uuid, default `gen_random_uuid()`), `created_at`, `cancelled_at`,
  `reminder_sent_at`.

### The double-booking guard

```sql
create unique index appointments_slot_unique
  on appointments (starts_at)
  where status <> 'cancelled';
```

Two simultaneous bookings for the same slot → Postgres rejects the second with a
unique-violation. The route handler catches it and returns **409 "ese turno acaba de
ser tomado"**. No application-level locking, no read-then-write race.

### RLS

The browser never talks to Supabase directly — public pages are server-rendered and
the admin goes through the server too. So RLS is defence-in-depth:

- `appointments`, `weekly_schedule`, `schedule_blocks`: **deny all** to `anon`;
  full access to `authenticated`.
- `services`, `clinic_settings`: select allowed to `anon` (harmless), writes
  `authenticated` only.
- The `motivo` column is never returned by any anon-reachable code path.

### Sensitive data handling (Ley 25.326)

You chose to collect an optional free-text `motivo`, which is a **dato sensible**
under Art. 2. Required mitigations, built in from the start:

1. Field is clearly **optional** and labelled as such.
2. Consent checkbox whose wording explicitly names health data, linking to
   `/privacidad`. Store `consent_at`.
3. `motivo` readable only by Rosa — never by `anon`, never in an email to anyone but her.
4. **Purge `motivo`** on a nightly job once the turno is >30 days past.
5. **Anonymise** name/phone/email on turnos older than 12 months (same job).

---

## The slot engine — the one piece that must be right

A **pure function**, no I/O, in `src/lib/slots.ts`:

```
generateSlots({ from, to, weeklySchedule, blocks, taken, slotMinutes, now, horizonDays })
  → Slot[]
```

Logic: expand `weekly_schedule` across the date range → cut into `slotMinutes` chunks →
subtract `schedule_blocks` overlaps → subtract `taken` appointment starts → drop
anything in the past or beyond `now + horizonDays`.

Keeping it pure is what makes it cheap to test exhaustively. Everything else in the app
is CRUD.

**Timezone rule:** all arithmetic in a single zone constant. Argentina currently has no
DST, but do not hardcode UTC-3 — use the IANA zone via `date-fns-tz` so a future DST
change doesn't silently shift every turno by an hour.

---

## Routes

### Public (server components)

- `/` — hero, servicios, por qué Rosa, CTA "Sacar un turno"
- `/servicios` — service list with prices from the DB
- `/sobre-mi` — about Rosa
- `/como-llegar` — address, map embed, hours, WhatsApp link
- `/turnos` — **the booking flow**: pick a day → pick a slot → form → confirmation
- `/turnos/cancelar/[token]` — shows the turno, one button to cancel
- `/privacidad` — privacy notice (required by the consent checkbox)

SEO: `generateMetadata` per page, `LocalBusiness`/`MedicalBusiness` JSON-LD on the
homepage with address and hours, a sitemap. This is how Rosa gets found for
"podóloga <ciudad>" — it's the main reason we're paying the Next.js complexity tax.

### API route handlers

- `POST /api/turnos` — zod validation → IP rate limit → horizon check → per-contact
  cap → insert (catch 23505 → 409) → send both emails. **Re-validates availability
  server-side**; never trusts the slot the client posted.
- `POST /api/turnos/[token]/cancelar` — sets `cancelled`, frees the slot, emails Rosa.
- `GET /api/cron/recordatorios` — Vercel cron, daily. Guarded by `CRON_SECRET` in the
  `Authorization` header. Sends tomorrow's reminders. **Must be idempotent** — set
  `reminder_sent_at` so a retry can't double-send.
- `GET /api/cron/retencion` — nightly purge/anonymise job (see above).

### Admin (`/admin/*`, auth-gated)

Supabase Auth, **email + password, single user created by hand in the dashboard**.
Public signup disabled. Session handled by `middleware.ts` calling
`supabase.auth.getClaims()` per the current `@supabase/ssr` pattern (note:
`@supabase/auth-helpers-nextjs` is deprecated — do not use it).

- `/admin` — **today's turnos**, mobile-first. This is the screen Rosa lives in.
- `/admin/nuevo` — create a turno by hand for phone/walk-in patients. **No horizon
  limit here** — this is how "te espero en un mes" works. Must be usable one-handed
  on a phone with a patient standing in front of her.
- `/admin/manana` — tomorrow's list, each row with a **`wa.me` link and a pre-filled
  message**. Rosa taps through them once a day. This is the real reminder channel.
- `/admin/agenda` — edit the weekly schedule.
- `/admin/bloqueos` — add vacations/holidays.
- `/admin/servicios` — edit services and prices.

---

## Stack

- Next.js (App Router, TypeScript), Tailwind, **shadcn/ui** (components vendored
  in-repo, so restyling later is free)
- `@supabase/supabase-js` + `@supabase/ssr`
- `zod` for input validation, `date-fns` + `date-fns-tz`
- `resend` + `@react-email/components` for the email templates
- Vitest

**Design direction:** calm clinical — soft neutrals, one accent, generous type sizes,
high contrast, large tap targets. Many patients are older and on a phone outdoors.
Mobile-first throughout, admin included.

---

## Build order

1. **Scaffold + Supabase schema + RLS + seed data.** Nothing works until the DB is right.
2. **Slot engine + its tests.** Pure function, no UI. Get this correct in isolation.
3. **Public booking flow** — day picker, slot grid, form, `POST /api/turnos`, unique-index 409 handling.
4. **Emails** — confirmation with the cancel link, Rosa's new-booking notice; the cancel page.
5. **Admin** — auth + today's view + manual creation. Rosa can now actually use it.
6. **Marketing pages + SEO** — content, JSON-LD, metadata, sitemap.
7. **Crons** — reminders and the retention job.
8. **Admin schedule/blocks/services editors** — the last step that makes Rosa independent of you.

Steps 1–5 are a usable product. 6–8 are what make it worth having built.

---

## Verification

- `npx vitest run` — slot engine: split shifts, a block mid-shift, a fully-booked day,
  the 15-day boundary, past slots, and a date that lands on a schedule edge.
- **Concurrency test:** fire two `POST /api/turnos` at the same slot with
  `Promise.all`; assert exactly one 201 and one 409, and exactly one row in the DB.
- **Manual end-to-end:** book a turno → confirmation email arrives (check it's not in
  spam — this is what the domain verification was for) → the slot disappears from the
  public grid → open the cancel link → slot reappears → the turno shows in `/admin`.
- **Cron:** hit `/api/cron/recordatorios` with the secret against seeded
  tomorrow-turnos; run it twice and assert the second run sends nothing.
- **Rosa test:** hand her the phone and have her book a phone turno and block a week
  off, with no help from you. If she can't, the admin isn't done.

---

## Open questions for Rosa

1. **Appointment length** — the whole engine assumes one fixed number. If treatments
   genuinely differ (30-min quiropodía vs 60-min estudio biomecánico), the slot engine
   needs per-service durations and this is the moment to find out, not after.
2. Working hours, including split shifts.
3. Which services and prices to publish, if any.
4. The WhatsApp number for the `wa.me` links.
