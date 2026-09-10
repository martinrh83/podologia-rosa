-- Sacar el tope de turnos activos por persona.
--
-- 0 significa "sin límite" y es el nuevo default. La columna y la verificación
-- quedan: si alguna vez alguien llena la agenda, volver a activarlo es poner un
-- número acá, sin tocar código ni desplegar.
--
-- Lo que sigue protegiendo la agenda: el tope de intentos por hora por IP y el
-- horizonte de 15 días del formulario público.

alter table clinic_settings alter column max_active_per_contact set default 0;
update clinic_settings set max_active_per_contact = 0;
