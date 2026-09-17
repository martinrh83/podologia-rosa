---
name: Podología Mitre
description: Consultorio de podología en Salta con turnos online, impreso como la tarjetita de turno del mostrador.
colors:
  background: "#e2eaf0"
  surface: "#fbfcfd"
  surface-muted: "#d5dfe7"
  foreground: "#191d27"
  muted: "#4b5568"
  border: "#b4c0cb"
  accent: "#3f3a9b"
  accent-hover: "#2f2b7e"
  accent-soft: "#e4e3f4"
  birome: "#1d44b3"
  numerador: "#b8342a"
  danger: "#9f3a38"
  success: "#1f6b46"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(2.35rem, 10.5vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
    fontVariation: "\"wdth\" 118"
  headline:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(2rem, 7vw, 3.1rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontVariation: "\"wdth\" 118"
  title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body-lead:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Archivo, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.1em"
    fontVariation: "\"wdth\" 80"
  hand:
    fontFamily: "Kalam, cursive"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: "2.1rem"
  stamp:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "0.04em"
    fontVariation: "\"wdth\" 80"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  gutter: "1rem"
  gutter-sm: "1.5rem"
  section: "4rem"
  section-sm: "6rem"
  container: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0.875rem 1.75rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "#ffffff"
  button-outline-ink:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.25rem"
  button-outline-ink-hover:
    backgroundColor: "{colors.foreground}"
    textColor: "#ffffff"
  button-outline-sello:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.25rem"
  button-outline-sello-hover:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
  card-turno:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    width: "28rem"
  card-sede:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    padding: "1.25rem 1.75rem 1.5rem"
  card-label:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  card-fill:
    textColor: "{colors.birome}"
    typography: "{typography.hand}"
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.stamp}"
    rounded: "{rounded.none}"
    padding: "0.375rem 0.75rem"
  nav-link:
    textColor: "{colors.muted}"
  nav-link-active:
    textColor: "{colors.accent}"
---

# Design System: Podología Mitre

## Overview

**Creative North Star: "La tarjetita de turno"**

El sitio está impreso como la tarjeta que te dan en el mostrador de un consultorio argentino: una cartulina celeste grisácea, impresa en una sola tinta casi negra, con renglones y rótulos de formulario, datos completados a mano en birome, el sello de goma violeta del consultorio y el rojo del numerador para las alturas de las calles. Todo lo que se ve tiene un equivalente en ese objeto de papel; lo que no lo tiene, no entra.

La densidad es la de un formulario: encabezados anchos y pesados subrayados con raya doble, renglones finos, letra chica legible a 17px de base. No hay fotos de ambiente ni tarjetas con íconos: la información real (con quién, qué días, dónde, qué obra social) se presenta escrita sobre la tarjeta, y eso es la ilustración. El movimiento es un solo gesto físico, el golpe del sello, y botones que se hunden al apretarlos.

Tema claro a propósito: se lee de día, en la calle, desde el teléfono. Se rechaza el sitio de clínica estándar: foto de stock, celeste genérico, tarjetas con íconos.

**Key Characteristics:**
- Cartulina como suelo, tarjeta blanca como único plano elevado.
- Cuatro tintas con oficio fijo: imprenta, birome, sello, numerador.
- Una sola familia (Archivo) en tres anchos; Kalam sólo para lo escrito a mano.
- Esquinas vivas en todo el sitio; filetes, rayas dobles y troquel en lugar de sombras.
- Un único golpe de sello animado por página; botones que se hunden como un sello.

## Colors

Una cartulina fría impresa con cuatro tintas, cada una con un solo oficio.

### Primary
- **Tinta de sello** (accent): la marca y la acción. El botón «Sacar turno», el isotipo, los sellos de goma, el foco, la selección de texto, el ítem activo del menú y el ícono de las preguntas.
- **Sello cargado** (accent-hover): el mismo violeta con más tinta, sólo para hover de lo que ya es sello.
- **Sello aguado** (accent-soft): fondo tenue violeta heredado por /turnos y el panel para estados seleccionados; no aparece en el home.

### Secondary
- **Azul birome** (birome): lo que se completa a mano. Los datos escritos en los renglones de la tarjeta, la segunda línea del titular, el tilde de las casillas y el cursor de texto.

### Tertiary
- **Rojo numerador** (numerador): los números que se buscan en la puerta (la altura de cada dirección), la marca «Turno» del encabezado de la tarjeta y el pin de los croquis. Sobre la tarjeta blanca a cualquier tamaño; sobre la cartulina sólo en tamaño grande (5.2:1 sobre la tarjeta).

### Neutral
- **Cartulina** (background): el suelo de todas las páginas, y el color de las muescas del troquel.
- **Tarjeta blanca** (surface): la tarjeta de turno, las tarjetas de sede, el marco de la foto carnet, el hover de los botones de contorno en el hero.
- **Cartulina a la sombra** (surface-muted): el suelo de los croquis, el fondo de la foto carnet vacía y el carril del scrollbar.
- **Tinta de imprenta** (foreground): texto, titulares, rayas dobles, filetes de tarjeta y contornos de botón secundario (13.9:1 sobre la cartulina).
- **Tinta suave** (muted): rótulos impresos, bajadas, respuestas y la letra chica del pie (6.2:1 sobre la cartulina).
- **Renglón impreso** (border): los renglones de la tarjeta, las divisiones entre filas y los puntos del troquel.
- **Rojo de aviso** (danger) y **Verde confirmado** (success): estados del flujo de reserva y del panel; no forman parte de la tarjeta.

### Named Rules
**The Cuatro Tintas Rule.** Cada tinta tiene un oficio y no presta servicio en otro: imprenta para lo impreso, birome para lo escrito a mano, sello para marca y acción, numerador para números y la marca de turno. Un párrafo en birome o un botón en rojo rompen la tarjeta.

**The Numerador Escaso Rule.** El rojo aparece en cifras cortas, nunca en texto corrido ni en fondos; si una pantalla tiene más de un puñado de toques rojos, sobra alguno.

## Typography

**Display Font:** Archivo, variable con eje de ancho (Omnibus-Type, Buenos Aires)
**Body Font:** Archivo
**Label Font:** Archivo angosta
**Hand Font:** Kalam (400 y 700)

**Character:** Una sola letra de imprenta que se estira para el encabezado de la tarjeta y se angosta para sus rótulos, contra una birome redonda y suelta que completa los datos. El contraste es entre imprenta y mano, no entre dos tipografías de imprenta.

### Hierarchy
- **Display** (800, ancho 118, clamp(2.35rem, 10.5vw, 5.5rem); desde lg clamp(3.5rem, 6.2vw, 5.5rem), 0.95, -0.03em): sólo el titular del hero, a escala de afiche. Su segunda línea puede ir en birome (Kalam 700, 1.12em, girada -2°).
- **Headline** (800, ancho 118, clamp(2rem, 7vw, 3.1rem), 1, -0.025em): el título de cada sección, con raya doble de 5px debajo. Los títulos de tarjeta de sede usan el mismo ancho a clamp(1.35rem, 4.5vw, 1.6rem).
- **Title** (700, 1.3rem, 1.25, -0.01em): nombre de cada tratamiento y textos de botón (1.05 a 1.15rem, 700).
- **Body lead** (400, 1.15rem, subiendo a 1.3rem en el hero, 1.625): bajadas, hasta 40 a 52ch.
- **Body** (400, 1rem = 17px, 1.625): descripciones, biografías y respuestas, hasta 46 a 62ch.
- **Label** (600, ancho 80, 0.875rem, 0.1em, mayúsculas): los rótulos impresos de los renglones de la tarjeta («Con», «Días», «Sedes») y la letra chica del pie. El nombre de marca en el encabezado usa el mismo ancho a 800 con 0.06em.
- **Hand** (Kalam 700, 1.45rem, 2.1rem de interlínea, birome): los datos completados en los renglones. Kalam 400 a 1.05rem en tinta suave para el renglón vacío («los elegís vos»).
- **Stamp** (900, ancho 80, 1.35rem, 0.04em, mayúsculas): el texto dentro de un sello, con una segunda línea a 700 y 0.14 a 0.16em.

### Named Rules
**The Tres Anchos Rule.** Ancha (wdth 118) para encabezados, normal para leer, angosta (wdth 80) para rótulos y sellos. Se aplica con `font-variation-settings`, nunca con `font-stretch`, que la cara variable ignora.

**The Birome Corta Rule.** Kalam sólo para datos cortos escritos sobre un renglón o una frase breve agregada a mano, y siempre a 1.05rem o más. Nunca texto corrido, botones, navegación ni rótulos.

**The Rótulo Es Campo Rule.** Las versalitas angostas son el rótulo de un campo de la tarjeta (un `dt` junto a su dato) o letra chica impresa. Nunca van flotando encima de un título de sección como antetítulo.

## Layout

Una columna de formulario centrada de 72rem, con 1rem de margen en el teléfono y 1.5rem desde sm. Cada sección del home tiene 4rem de aire vertical, 6rem desde sm, y se separa de la anterior con una fila de troquel a todo el ancho. Las secciones arrancan con su título y raya doble, y el contenido se ordena en dos columnas desde sm (tratamientos, profesionales, sedes) para que el texto arranque en los mismos dos bordes en todo el home; las preguntas van a todo el ancho con las respuestas limitadas a 62ch.

El hero es de dos columnas desde lg (texto flexible y tarjeta de 25rem, 28rem desde xl); en el teléfono la tarjeta baja debajo del titular y la acción, que quedan visibles sin scroll. En el teléfono «Sacar turno» ocupa todo el ancho y llamar / WhatsApp van lado a lado. El encabezado es fijo, con la cartulina al 95% y desenfoque, y se cierra con un filete de 2px en tinta. La base tipográfica es 17px (106.25%), así que todas las medidas en rem escalan con ella. Lo girado que asoma (sellos, tarjeta) se recorta con `overflow-x: clip` en el main.

### Named Rules
**The Troquel Rule.** Las secciones se separan con la línea perforada (puntos de 1.6px en color renglón, cada 10px, 6px de alto), y con nada más: ni fondos alternados, ni bandas de color. El pie arranca con el mismo troquel.

## Elevation & Depth

El sistema es plano: la profundidad se dice con filetes, rayas dobles, cambios entre cartulina y tarjeta blanca y el giro leve de lo que está apoyado. Hay una sola sombra en todo el sitio, la de la tarjeta de turno del hero, corta y suave como una cartulina apoyada en el mostrador. Las tarjetas de sede, la foto carnet y los sellos no llevan sombra.

### Shadow Vocabulary
- **Tarjeta apoyada** (`box-shadow: 0 1px 1px rgb(25 29 39 / 0.08), 0 14px 28px -12px rgb(25 29 39 / 0.35)`): exclusivamente la tarjeta de turno del hero.

### Named Rules
**The Tarjeta Apoyada Rule.** Una sombra por sitio, y es de la tarjeta. Cualquier otro plano se separa con un filete de 1px en tinta o con la tarjeta blanca sobre la cartulina, nunca con sombra ni con sombra dura desplazada.

## Shapes

Esquinas vivas en todo: `rounded-lg` y `rounded-xl` valen 0 a nivel de tema, así que el panel y /turnos heredan el mismo criterio. El redondeo completo queda sólo para lo que en el objeto real es redondo: las muescas a los costados del troquel de la tarjeta y la píldora de pasos de la reserva. Las formas recurrentes son de imprenta: la raya doble de 5px bajo encabezados y croquis, el marco doble del sello (3px, 3px de aire, 1px), la casilla cuadrada de 2px con tilde en birome, el broche sobre la foto carnet. Lo apoyado se gira apenas: la tarjeta -1° (-2° desde lg), la foto -2°, los sellos entre -4° y -9°; un sello nunca queda derecho.

### Named Rules
**The Esquinas Vivas Rule.** Ningún botón, tarjeta, campo ni foco se redondea. El foco es un contorno de 2px en tinta de sello a 2px de distancia, sin radio, que sigue la esquina recta del elemento.

## Components

### Buttons
Bloques de tinta y contornos impresos que se hunden como un sello al apretarlos.
- **Shape:** esquinas vivas (0), borde de 2px siempre presente para que el relleno y el contorno midan igual.
- **Primary («Sacar turno»):** bloque en tinta de sello con texto blanco, 700, 0.875rem x 1.75rem en el hero (1.15rem de texto) y más compacto en el encabezado. Hay uno por vista y es siempre la acción de reservar.
- **Hover / Active:** hover pasa a sello cargado; al apretar baja 2px y escala a 0.985 en 100ms. Foco con el contorno de sello de 2px.
- **Contorno en tinta:** borde de 2px en tinta, texto en tinta; hover llena de tarjeta blanca (hero: llamar, WhatsApp) o de tinta con texto blanco (Abrir en Google Maps).
- **Contorno de sello:** borde de 2px en sello, texto en sello; hover llena de sello con texto blanco. Para «Sacar turno con …» en cada profesional.

### Cards / Containers
- **Tarjeta de turno (firma):** tarjeta blanca de hasta 28rem, girada, con la única sombra del sitio. Encabezado con isotipo y nombre en versalitas angostas, marca «Turno» en numerador y raya doble de 5px; renglones de 1px en color renglón con rótulo impreso a la izquierda y dato en birome a la derecha; un renglón vacío en tinta suave para lo que se elige online; troquel con muescas de cartulina; talón con dónde y obras sociales; sello «Turno online» en la esquina baja.
- **Tarjeta de sede:** tarjeta blanca con filete de 1px en tinta, sin sombra ni radio; croquis arriba cerrado por raya doble, dirección como título ancho con la altura en numerador, 1.25 a 1.75rem de relleno, botón al fondo alineado entre tarjetas.

### Sello
Marco doble en tinta de sello (3px, 3px de aire, 1px), versalitas angostas negras, siempre girado y con `mix-blend-multiply` para que la tinta se asiente sobre lo de abajo. Tinta plana, sin grano simulado: se reconoce por la forma y se lee entero. Es HTML, no imagen; en profesionales, el nombre dentro del sello es el título de la ficha.

### Renglones y listas
- **Tratamientos:** filas separadas por renglón de 1px, 1.5rem de aire, con una casilla impresa ya tildada en birome (no es un control) y el nombre como title.
- **Preguntas frecuentes:** `details` nativos a todo el ancho separados por renglón, pregunta en 600 a 1.05rem que pasa a sello en hover, cruz SVG en sello que gira 45° en 300ms al abrir.

### Navigation
Encabezado fijo sobre cartulina al 95% con filete inferior de 2px en tinta. Marca a la izquierda: isotipo en sello y nombre en versalitas angostas 800. En escritorio los enlaces van en Archivo 500 a 0.95rem en tinta suave, tinta en hover, y el activo en sello subrayado a 2px con 6px de separación. «Sacar turno» siempre visible a la derecha. En el teléfono un botón de dos barras que se cruzan abre una lista de renglones a 1.05rem con el activo en sello; debajo de 390px el nombre se apila en dos líneas.

### Croquis de sede
SVG propio generado desde OpenStreetMap, impreso con la paleta de la cartulina: suelo cartulina a la sombra, calles casi blancas, avenidas tarjeta blanca, plazas y agua en azules grises, bordes color renglón, nombres en tinta con halo blanco y el pin en numerador.

## Do's and Don'ts

### Do:
- **Do** tratar cada pantalla como una pieza impresa sobre cartulina (background) con, a lo sumo, una tarjeta blanca (surface) apoyada.
- **Do** separar secciones con la fila de troquel y abrir cada una con título ancho (wdth 118, 800) y raya doble de 5px en tinta.
- **Do** escribir en birome (Kalam, birome) los datos reales que completan un renglón, a 1.05rem o más.
- **Do** poner las alturas de las direcciones en rojo numerador, en negrita y con cifras tabulares.
- **Do** dar a cada botón borde de 2px, esquinas vivas y el hundimiento de 2px / 0.985 en 100ms.
- **Do** girar lo apoyado (tarjeta, foto, sellos) entre -1° y -9°, y dejar derecho todo lo impreso.
- **Do** reservar la animación `sellar` (520ms, cubic-bezier(0.16, 1, 0.3, 1), 380ms de espera) para un único sello por página, y dejarlo quieto con movimiento reducido.

### Don't:
- **Don't** usar foto de stock, celeste genérico de clínica ni tarjetas con íconos.
- **Don't** redondear esquinas; `rounded-full` sólo para lo que es redondo de verdad.
- **Don't** agregar sombras fuera de la tarjeta de turno, ni sombras duras desplazadas.
- **Don't** usar Kalam para párrafos, botones, navegación o rótulos.
- **Don't** usar rojo numerador para texto corrido, fondos o botones.
- **Don't** poner antetítulos en versalitas encima de los títulos de sección; las versalitas son rótulos de campo.
- **Don't** simular grano, manchas ni bordes corridos en los sellos; la tinta es plana.
- **Don't** separar secciones con fondos alternados o bandas de color.
