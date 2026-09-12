-- Volver al índice único, a cambio de perder la protección contra solapamiento.
--
-- La restricción de exclusión que venía de 0003 y que 0006 particionó por
-- profesional comparaba RANGOS: dos turnos activos de la misma persona no podían
-- pisarse ni un minuto, empezaran donde empezaran. Se reemplaza por un índice
-- único sobre la hora de inicio, que es el mecanismo que se usa en todos lados y
-- que cualquiera lee de una mirada.
--
-- QUÉ SE SIGUE PROTEGIENDO
--
--   Dos personas tocando el mismo horario al mismo tiempo. Es el caso real y
--   frecuente: Postgres rechaza el segundo insert con 23505 y el endpoint lo
--   traduce a un 409. Sigue sin haber carrera entre leer y escribir.
--
-- QUÉ SE DEJA DE PROTEGER, A SABIENDAS
--
--   Turnos que se pisan sin empezar a la misma hora:
--
--     Rosa 11:00-12:00  +  Rosa 11:15-12:00   -> los dos entran
--
--   Para el índice son dos filas distintas, porque `starts_at` difiere. Esto no
--   es hipotético: pasó en este proyecto cuando la duración del turno cambió de
--   45 a 60 minutos y los turnos ya reservados quedaron fuera de la grilla
--   nueva. El disparador sigue existiendo, y ahora en más lugares: cada
--   profesional tiene su propia duración y se edita desde el panel.
--
--   Si alguna vez aparecen dos pacientes esperando el mismo box, empezar por
--   acá: revertir esta migración devuelve la protección.
--
-- El `where status <> 'cancelled'` se mantiene por el mismo motivo de siempre:
-- un turno cancelado deja de ocupar el horario, pero la fila se queda (el enlace
-- de cancelación tiene que seguir resolviendo, y la retención necesita algo que
-- anonimizar). Sin esa condición, cancelar quemaría el horario para siempre.

alter table appointments drop constraint appointments_no_overlap;

create unique index appointments_slot_unique
  on appointments (practitioner_id, starts_at)
  where status <> 'cancelled';

-- `btree_gist` queda instalada aunque ya no la use nadie: sacarla es un
-- `drop extension` y no vale el riesgo de que algo más la necesite. Si se
-- vuelve a la restricción de exclusión, ya está puesta.
