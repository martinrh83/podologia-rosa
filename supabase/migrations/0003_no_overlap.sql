-- Impedir turnos SUPERPUESTOS, no sólo turnos con la misma hora de inicio.
--
-- El índice único original era sobre starts_at, así que dos turnos que empezaban
-- a la misma hora chocaban, pero uno de 11:00 a 12:00 y otro de 11:15 a 12:00
-- convivían sin problema. Con todos los turnos saliendo de la misma grilla eso
-- no se notaba; cambiar la duración de 45 a 60 minutos dejó turnos viejos fuera
-- de la grilla nueva y el agujero apareció enseguida.
--
-- La restricción de exclusión compara los RANGOS: dos turnos activos no pueden
-- solaparse ni un minuto, sin importar dónde empiecen. Los rangos son
-- semiabiertos [inicio, fin), así que un turno que termina 12:00 y otro que
-- empieza 12:00 no se pisan.

alter table appointments
  add constraint appointments_no_overlap
  exclude using gist (tstzrange(starts_at, ends_at) with &&)
  where (status <> 'cancelled');

-- Ya es redundante: si no puede haber solapamiento, tampoco puede haber dos
-- turnos con el mismo inicio.
drop index if exists appointments_slot_unique;
