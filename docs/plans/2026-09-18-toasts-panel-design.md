# Toasts en el panel

Las confirmaciones de éxito del panel pasan a un toast de Sonner. Los errores no
cambian.

## Por qué

El «Guardado.» en verde al lado del botón se pasa por alto con facilidad,
sobre todo en el teléfono: es letra chica en un lugar donde no se mira después
de tocar. Y en las acciones de un toque —cancelar un turno, dar de baja— el
renglón desaparece y nada confirma que haya funcionado.

## Qué se usa

[Sonner](https://sonner.emilkowal.ski), con su estilo por defecto y sin
personalizar. Es la librería de toasts más usada en 2026 (unas 45 M descargas
por semana en npm, contra 3–4 M de react-toastify y react-hot-toast), soporta
React 19 y resuelve sola la pausa al pasar el mouse, el deslizar para cerrar,
la accesibilidad y el movimiento reducido. No carga nada de afuera.

Se acepta a propósito que su estilo por defecto (tarjeta blanca, esquinas
redondeadas, sombra) no sigue DESIGN.md. Si hace falta, se ajusta después.

## Qué muestra

Sólo éxitos, y dice qué cambió:

- «Sede Centro guardada.»
- «Turno de las 16:00 cancelado.»
- «Bea López, de baja.»

Los errores siguen donde se arreglan: el de un campo en el campo, el del
formulario en el aviso rojo arriba del botón. Un error no puede desaparecer
solo a los cuatro segundos.

## Dónde se dispara

- **Fichas que se editan** (profesionales, sedes, precios, consultorio) y
  **altas**: cuando la acción vuelve con estado «saved».
- **Acciones de un botón** (`ActionButton`, `InlineAction`, `ConfirmAction`):
  una prop `success` con el texto, que arma la pantalla que ya conoce el nombre
  o la hora.
- **Nuevo turno**: la página vuelve con `?guardado=<fecha>`. Un componente
  cliente muestra el toast al llegar y saca el parámetro de la URL, para que
  recargar no lo repita. Reemplaza al aviso verde de hoy.

## Cómo se arma

- `npm install sonner`.
- Un `<Toaster position="bottom-left" />` en `src/app/admin/layout.tsx`, con el
  resto de las opciones por defecto.
- Cada lugar llama a `toast.success("…")`. Sin envoltorio propio.
- Se sacan el «Guardado.» / «Listo, …» de al lado de los botones
  (`ActionResult`) y el aviso verde de Nuevo turno.
- Se mantiene el «Guardando…» del botón mientras guarda: es el estado en curso,
  no el resultado.

## Cómo se prueba

- `tsc`, `eslint` y `vitest`.
- En el navegador, a 390px y 1280px: guardar una ficha, dar un alta, cancelar un
  turno, dar de baja y reactivar, guardar un turno nuevo. Revisar el texto de
  cada toast y que un error siga en su lugar y no dispare toast.
