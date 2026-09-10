-- Seed data. Safe to re-run: every insert is guarded.
-- Replace the placeholder clinic details with Rosa's real ones before going live.

insert into clinic_settings (id, slot_minutes, horizon_days, max_active_per_contact,
                             clinic_name, address, phone, whatsapp, map_url)
values (true, 45, 15, 2,
        'Podología Rosa',
        'Av. Siempreviva 742, Buenos Aires',
        '+54 11 5555-4444',
        '+5491155554444',
        null)
on conflict (id) do nothing;

-- Monday to Friday, split shift: mornings 09:00-13:00, afternoons 16:00-20:00.
-- Two rows per day is what expresses the midday break.
insert into weekly_schedule (weekday, start_time, end_time)
select weekday, start_time, end_time
from (values
  (1, '09:00'::time, '13:00'::time), (1, '16:00'::time, '20:00'::time),
  (2, '09:00'::time, '13:00'::time), (2, '16:00'::time, '20:00'::time),
  (3, '09:00'::time, '13:00'::time), (3, '16:00'::time, '20:00'::time),
  (4, '09:00'::time, '13:00'::time), (4, '16:00'::time, '20:00'::time),
  (5, '09:00'::time, '13:00'::time), (5, '16:00'::time, '20:00'::time)
) as s(weekday, start_time, end_time)
where not exists (select 1 from weekly_schedule);

insert into services (name, description, price, display_order)
select name, description, price, display_order
from (values
  ('Quiropodia',            'Tratamiento completo de callos, durezas y uñas.', 15000::numeric, 1),
  ('Uñas encarnadas',       'Tratamiento y seguimiento de onicocriptosis.',    18000::numeric, 2),
  ('Pie diabético',         'Control y cuidado preventivo especializado.',     20000::numeric, 3),
  ('Verrugas plantares',    'Tratamiento de papilomas en la planta del pie.',  18000::numeric, 4),
  ('Estudio de la pisada',  'Evaluación biomecánica y recomendaciones.',       25000::numeric, 5)
) as s(name, description, price, display_order)
where not exists (select 1 from services);
