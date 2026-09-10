-- Podología Rosa — initial schema
-- All timestamps are timestamptz (UTC). Formatting to America/Argentina/Buenos_Aires
-- happens at the presentation edges only, never in the database.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- clinic_settings — singleton row holding operational knobs Rosa can tune
-- without a redeploy.
-- ---------------------------------------------------------------------------
create table clinic_settings (
  id                     boolean primary key default true,
  slot_minutes           integer not null default 60,
  horizon_days           integer not null default 15,
  max_active_per_contact integer not null default 0,
  clinic_name            text    not null default 'Podología Rosa',
  address                text,
  phone                  text,
  whatsapp               text,
  map_url                text,
  updated_at             timestamptz not null default now(),
  -- enforces the singleton: only one row can ever exist
  constraint clinic_settings_singleton check (id)
);

-- ---------------------------------------------------------------------------
-- services — display only. Deliberately does NOT affect slot length; every
-- turno is clinic_settings.slot_minutes long.
-- ---------------------------------------------------------------------------
create table services (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  price         numeric(12, 2),
  display_order integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index services_active_order_idx on services (active, display_order);

-- ---------------------------------------------------------------------------
-- weekly_schedule — recurring working hours. Multiple rows per weekday express
-- a split shift, e.g. Monday 09:00-13:00 and 16:00-20:00 is two rows.
-- ---------------------------------------------------------------------------
create table weekly_schedule (
  id         uuid primary key default gen_random_uuid(),
  weekday    smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time   time not null,
  created_at timestamptz not null default now(),
  constraint weekly_schedule_range check (end_time > start_time)
);

create index weekly_schedule_weekday_idx on weekly_schedule (weekday, start_time);

-- ---------------------------------------------------------------------------
-- schedule_blocks — one-off closures: holidays, vacations, personal errands.
-- ---------------------------------------------------------------------------
create table schedule_blocks (
  id         uuid primary key default gen_random_uuid(),
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),
  constraint schedule_blocks_range check (ends_at > starts_at)
);

create index schedule_blocks_range_idx on schedule_blocks (starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- appointments (turnos)
-- ---------------------------------------------------------------------------
create type appointment_status as enum ('booked', 'cancelled', 'completed', 'no_show');
create type appointment_source as enum ('online', 'admin');

create table appointments (
  id               uuid primary key default gen_random_uuid(),
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  status           appointment_status not null default 'booked',
  source           appointment_source not null default 'online',
  patient_name     text not null,
  patient_phone    text not null,
  patient_email    text,
  -- Optional free text. This is a DATO SENSIBLE under Ley 25.326 art. 2:
  -- readable by Rosa only, never exposed to anon, purged 30 days after the turno.
  motivo           text,
  consent_at       timestamptz,
  cancel_token     uuid not null default gen_random_uuid(),
  reminder_sent_at timestamptz,
  anonymized_at    timestamptz,
  created_at       timestamptz not null default now(),
  cancelled_at     timestamptz,
  constraint appointments_range check (ends_at > starts_at)
);

-- THE double-booking guard. Two concurrent inserts for the same slot: Postgres
-- rejects the second with SQLSTATE 23505 and the route handler turns that into a
-- 409. No read-then-write race, no application-level locking.
create unique index appointments_slot_unique
  on appointments (starts_at)
  where status <> 'cancelled';

create unique index appointments_cancel_token_idx on appointments (cancel_token);
create index appointments_starts_at_idx on appointments (starts_at);
-- Supports the per-contact active-turno cap.
create index appointments_contact_idx on appointments (patient_phone, status);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- The browser never talks to Supabase directly: public pages are server-rendered
-- and the admin goes through the server too. RLS is therefore defence-in-depth --
-- if a key ever leaks into a client bundle, anon still cannot read patient data.
-- Server-side writes use the service role key, which bypasses RLS by design.
-- ---------------------------------------------------------------------------
alter table clinic_settings  enable row level security;
alter table services         enable row level security;
alter table weekly_schedule  enable row level security;
alter table schedule_blocks  enable row level security;
alter table appointments     enable row level security;

-- Public, non-sensitive: anyone may read.
create policy "clinic_settings readable by all"
  on clinic_settings for select using (true);
create policy "services readable by all"
  on services for select using (true);

-- Everything else: authenticated (Rosa) only. No policy for anon means no access.
create policy "clinic_settings writable by staff"
  on clinic_settings for all to authenticated using (true) with check (true);
create policy "services writable by staff"
  on services for all to authenticated using (true) with check (true);
create policy "weekly_schedule staff only"
  on weekly_schedule for all to authenticated using (true) with check (true);
create policy "schedule_blocks staff only"
  on schedule_blocks for all to authenticated using (true) with check (true);
create policy "appointments staff only"
  on appointments for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- rate_limit_hits — best-effort throttle for the public booking endpoint.
--
-- Deliberately in Postgres rather than in process memory: on Vercel each request
-- may hit a different lambda instance, so an in-memory counter would reset
-- constantly and enforce nothing. The IP is stored as a salted hash so the table
-- holds no directly identifying data.
-- ---------------------------------------------------------------------------
create table rate_limit_hits (
  id         bigserial primary key,
  bucket     text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_hits_bucket_idx on rate_limit_hits (bucket, created_at desc);

alter table rate_limit_hits enable row level security;
-- No policies: only the service role (which bypasses RLS) ever touches this.
