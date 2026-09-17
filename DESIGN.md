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
  accent: "#163c76"
  accent-hover: "#0f2b57"
  accent-soft: "#e7eefb"
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
  pregunta:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(1.75rem, 6vw, 2.6rem)"
    fontWeight: 800
    lineHeight: 1.05
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
  aside: "21rem"
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
  button-primary-block:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "1rem 1.25rem"
    width: "100%"
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
  button-outline-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.none}"
    padding: "0.875rem 1rem"
    width: "100%"
  button-outline-danger-hover:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
  chip-opcion:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1rem"
  chip-opcion-selected:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    padding: "0.75rem 0.875rem"
    width: "100%"
  input-field-error:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
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
  aviso-muted:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    padding: "1.25rem"
  aviso-danger:
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    padding: "1.25rem"
  aviso-success:
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    padding: "1.25rem"
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

El sitio está impreso como la tarjeta que te dan en el mostrador de un consultorio argentino: una cartulina celeste grisácea, impresa en una sola tinta casi negra, con renglones y rótulos de formulario, datos completados a mano en birome, el sello de goma azul del consultorio y el rojo del numerador para las alturas de las calles. Todo lo que se ve tiene un equivalente en ese objeto de papel; lo que no lo tiene, no entra.

La densidad es la de un formulario: encabezados anchos y pesados subrayados con raya doble, renglones finos, letra chica legible a 17px de base. No hay fotos de ambiente ni tarjetas con íconos: la información real (con quién, qué días, dónde, qué obra social) se presenta escrita sobre la tarjeta, y eso es la ilustración. El movimiento es un solo gesto físico, el golpe del sello, y botones que se hunden al apretarlos.

Sacar un turno es el mostrador: la misma tarjeta a un costado, armándose renglón por renglón, y una sola pregunta por vez del otro. La tarjeta no es un adorno del home, es el objeto que el paciente construye y se lleva. Tema claro a propósito: se lee de día, en la calle, desde el teléfono. Se rechaza el sitio de clínica estándar: foto de stock, celeste genérico, tarjetas con íconos.

**Key Characteristics:**
- Cartulina como suelo, tarjeta blanca como único plano elevado.
- Cuatro tintas con oficio fijo: imprenta, birome, sello, numerador.
- Una sola familia (Archivo) en tres anchos; Kalam sólo para lo escrito a mano.
- Esquinas vivas en todo el sitio; filetes, rayas dobles y troquel en lugar de sombras.
- Un único golpe de sello animado por página; botones que se hunden como un sello.
- En los flujos de varios pasos, el objeto que se arma queda siempre a la vista y la pantalla hace una pregunta por vez.

## Colors

Una cartulina fría impresa con cuatro tintas, cada una con un solo oficio.

### Primary
- **Tinta de sello** (accent): la marca y la acción. El botón «Sacar turno», el isotipo, los sellos de goma, el foco, la selección de texto, el ítem activo del menú, el ícono de las preguntas y el bloque relleno de la opción elegida en la reserva (día, horario, obra social).
- **Sello cargado** (accent-hover): el mismo azul con más tinta, sólo para hover de lo que ya es sello.
- **Sello aguado** (accent-soft): declarado en la hoja de estilos y hoy sin uso en ninguna pantalla; lo seleccionado se dice con el bloque lleno en tinta de sello, no con un fondo tenue.

### Secondary
- **Azul birome** (birome): lo que se completa a mano. Los datos escritos en los renglones de la tarjeta, la segunda línea del titular, el tilde de las casillas y el cursor de texto.

### Tertiary
- **Rojo numerador** (numerador): los números que se buscan en la puerta (la altura de cada dirección), la marca «Turno» del encabezado de la tarjeta y el pin de los croquis. Sobre la tarjeta blanca a cualquier tamaño; sobre la cartulina sólo en tamaño grande (5.2:1 sobre la tarjeta).

### Neutral
- **Cartulina** (background): el suelo de todas las páginas, el color de las muescas del troquel y, al 95% con desenfoque, el fondo de la tira fija de la reserva en el teléfono.
- **Tarjeta blanca** (surface): la tarjeta de turno, las tarjetas de sede, el marco de la foto carnet, los campos del formulario, los chips sin elegir y el hover de los botones de contorno en el hero.
- **Cartulina a la sombra** (surface-muted): el suelo de los croquis, el fondo de la foto carnet vacía, el aviso neutro y el carril del scrollbar.
- **Tinta de imprenta** (foreground): texto, titulares, rayas dobles, filetes de tarjeta, la raya de 2px que abre el formulario y contornos de botón secundario (13.9:1 sobre la cartulina).
- **Tinta suave** (muted): rótulos impresos, bajadas, respuestas, los renglones todavía sin completar y la letra chica del pie (6.2:1 sobre la cartulina).
- **Renglón impreso** (border): los renglones de la tarjeta, las divisiones entre filas, el contorno de los chips sin elegir y de los campos, y los puntos del troquel.
- **Rojo de aviso** (danger): el error de un campo, el aviso de que el horario se ocupó, el botón de cancelar y el sello «Cancelado». No forma parte de la tarjeta impresa.
- **Verde confirmado** (success): sólo la frase que confirma el turno y el aviso de éxito; nunca un fondo ni un botón.

### Named Rules
**The Cuatro Tintas Rule.** Cada tinta tiene un oficio y no presta servicio en otro: imprenta para lo impreso, birome para lo escrito a mano, sello para marca y acción, numerador para números y la marca de turno. Un párrafo en birome o un botón en rojo rompen la tarjeta.

**The Numerador Escaso Rule.** El rojo aparece en cifras cortas, nunca en texto corrido ni en fondos; si una pantalla tiene más de un puñado de toques rojos, sobra alguno.

**The Estado Con Tinta Rule.** Rojo de aviso y verde confirmado son estados del flujo, no colores de la tarjeta: van en el texto, en un contorno de 2px o en un aviso de fondo tenue, y nunca se usan como relleno de un botón principal ni como fondo de una sección.

## Typography

**Display Font:** Archivo, variable con eje de ancho (Omnibus-Type, Buenos Aires)
**Body Font:** Archivo
**Label Font:** Archivo angosta
**Hand Font:** Kalam (400 y 700)

**Character:** Una sola letra de imprenta que se estira para el encabezado de la tarjeta y se angosta para sus rótulos, contra una birome redonda y suelta que completa los datos. El contraste es entre imprenta y mano, no entre dos tipografías de imprenta.

### Hierarchy
- **Display** (800, ancho 118, clamp(2.35rem, 10.5vw, 5.5rem); desde lg clamp(3.5rem, 6.2vw, 5.5rem), 0.95, -0.03em): sólo el titular del hero, a escala de afiche. Su segunda línea puede ir en birome (Kalam 700, 1.12em, girada -2°).
- **Headline** (800, ancho 118, clamp(2rem, 7vw, 3.1rem), 1, -0.025em): el título de cada sección del home, con raya doble de 5px debajo. Los títulos de tarjeta de sede usan el mismo ancho a clamp(1.35rem, 4.5vw, 1.6rem).
- **Pregunta** (800, ancho 118, clamp(1.75rem, 6vw, 2.6rem), 1.05, -0.025em): el título de cada paso de la reserva, del acuse de confirmación y de cancelación. Es la pregunta que hace la pantalla y va sola, sin raya doble; los títulos internos de esas pantallas («Guardá este enlace», «¿No podés venir?») usan el mismo ancho a 1.35rem.
- **Title** (700, 1.3rem, 1.25, -0.01em): nombre de cada tratamiento y textos de botón (1.05 a 1.15rem, 700).
- **Body lead** (400, 1.15rem, subiendo a 1.2 o 1.3rem en el hero y en el acuse, 1.625): bajadas y la línea que sigue a cada pregunta, hasta 40 a 52ch.
- **Body** (400, 1rem = 17px, 1.625): descripciones, biografías y ayudas de campo, hasta 46 a 62ch. Las respuestas del FAQ son la excepción: van a todo el ancho de la sección (~120ch a 1512px). La letra chica de ayuda y de error va a 0.95rem.
- **Label** (600, ancho 80, 0.875rem, 0.1em, mayúsculas): los rótulos impresos de los renglones de la tarjeta («Con», «Días», «Día y hora»), la etiqueta de cada campo del formulario, el rótulo de un grupo de opciones (`legend`, «Día», «Horario», «Obra social») y la letra chica del pie. A 0.75rem en la tira fija del teléfono y en la sede de un chip.
- **Hand** (Kalam 700, 1.45rem, 2.1rem de interlínea, birome): los datos completados en los renglones; 1.25rem / 1.9rem cuando la tarjeta va en la columna angosta del mostrador y 1.05rem en la tira del teléfono. Kalam 400 a 1rem en tinta suave para el renglón vacío, que habla («lo elegís vos», «tus datos») en vez de poner un guión.
- **Stamp** (900, ancho 80, 1.2 a 1.35rem, 0.04em, mayúsculas): el texto dentro de un sello, con una segunda línea a 700 y 0.14 a 0.16em.

### Named Rules
**The Tres Anchos Rule.** Ancha (wdth 118) para encabezados, normal para leer, angosta (wdth 80) para rótulos y sellos. Se aplica con `font-variation-settings`, nunca con `font-stretch`, que la cara variable ignora.

**The Birome Corta Rule.** Kalam sólo para datos cortos escritos sobre un renglón o una frase breve agregada a mano, y siempre a 1rem o más. Nunca texto corrido, botones, navegación ni rótulos.

**The Rótulo Es Campo Rule.** Las versalitas angostas son el rótulo de un campo o de un grupo de campos (un `dt` junto a su dato, un `label`, un `legend` arriba de sus opciones) o letra chica impresa. Nunca van flotando encima de un título como antetítulo.

**The Paso En La Frase Rule.** El número de paso se dice dentro de la línea que sigue al título, en negrita («**Paso 2 de 3.** Los turnos duran 60 minutos…»), y se repite en la lista numerada al costado. Nunca como versalita encima del título ni como píldora.

## Layout

Una columna de formulario centrada de 72rem, con 1rem de margen en el teléfono y 1.5rem desde sm. Cada sección del home tiene 4rem de aire vertical, 6rem desde sm, y se separa de la anterior con una fila de troquel a todo el ancho. Las secciones arrancan con su título y raya doble, y el contenido se ordena en dos columnas desde sm (tratamientos, profesionales, sedes) para que el texto arranque en los mismos dos bordes en todo el home; las preguntas y sus respuestas van a todo el ancho, sin tope de medida: es la única prosa del sitio que no se limita, decidido a ojo porque cualquier tope dejaba media sección vacía a la derecha en pantallas grandes.

El hero es de dos columnas desde lg (texto flexible y tarjeta de 25rem, 28rem desde xl); en el teléfono la tarjeta baja debajo del titular y la acción, que quedan visibles sin scroll. En el teléfono «Sacar turno» ocupa todo el ancho y llamar / WhatsApp van lado a lado.

El mostrador (todo el camino de sacar y cancelar un turno) es una grilla propia dentro del mismo ancho: desde lg, una columna fija de 21rem con la tarjeta y lo que falta, pegada a 6rem del borde superior, y al lado la columna de la pregunta con 3.5rem de canal. Debajo de lg no hay dos columnas: la tarjeta entera desaparece y queda una tira fija con lo ya elegido, pegada a 3.4rem del techo (justo debajo del encabezado del sitio), y la pregunta ocupa la pantalla. Los días se envuelven en varias filas desde sm y en el teléfono se corren con el dedo, con una línea que dice cuántos hay; los horarios van en grilla de 3 columnas, 4 desde sm y 5 desde lg. El encabezado es fijo, con la cartulina al 95% y desenfoque, y se cierra con un filete de 2px en tinta. La base tipográfica es 17px (106.25%), así que todas las medidas en rem escalan con ella. Lo girado que asoma (sellos, tarjeta) se recorta con `overflow-x: clip` en el main.

### Named Rules
**The Troquel Rule.** Las secciones se separan con la línea perforada (puntos de 1.6px en color renglón, cada 10px, 6px de alto), y con nada más: ni fondos alternados, ni bandas de color. El pie arranca con el mismo troquel.

**The Mostrador Rule.** En un flujo de varios pasos, lo que se está armando queda a la vista todo el tiempo —tarjeta al costado en escritorio, tira fija arriba en el teléfono— y la columna principal hace una sola pregunta por pantalla. Nada de esconder lo ya decidido ni de pedir todo junto en una pantalla larga.

## Elevation & Depth

El sistema es plano: la profundidad se dice con filetes, rayas dobles, cambios entre cartulina y tarjeta blanca y el giro leve de lo que está apoyado. Hay una sola sombra en todo el sitio, la de la tarjeta de turno, que es la misma pieza en el hero y en el mostrador; corta y suave, como una cartulina apoyada en el mostrador. Las tarjetas de sede, la foto carnet, los chips, los campos, los avisos y los sellos no llevan sombra. La tira fija del teléfono no se separa con sombra sino con un renglón de 1px y la cartulina al 95% con desenfoque.

### Shadow Vocabulary
- **Tarjeta apoyada** (`box-shadow: 0 1px 1px rgb(25 29 39 / 0.08), 0 14px 28px -12px rgb(25 29 39 / 0.35)`): exclusivamente la tarjeta de turno.

### Named Rules
**The Tarjeta Apoyada Rule.** Una sombra por sitio, y es de la tarjeta. Cualquier otro plano se separa con un filete de 1px o 2px en tinta o con la tarjeta blanca sobre la cartulina, nunca con sombra ni con sombra dura desplazada.

**The Un Solo Blanco Rule.** En una misma pantalla hay a lo sumo un plano blanco grande. Por eso el formulario del último paso son renglones sobre la cartulina y lo blanco son los campos: un panel blanco alrededor de campos blancos contradice la tarjeta apoyada.

## Shapes

Esquinas vivas en todo: `rounded-lg` y `rounded-xl` valen 0 a nivel de tema, así que el panel y el flujo de turnos heredan el mismo criterio. El redondeo completo queda sólo para lo que en el objeto real es redondo: las muescas a los costados del troquel de la tarjeta, que son los dos únicos círculos del sitio. Las formas recurrentes son de imprenta: la raya doble de 5px bajo los encabezados del home, los croquis y el encabezado de la tarjeta; la raya de 2px en tinta que abre el formulario de datos; el marco doble del sello (3px, 3px de aire, 1px); el broche sobre la foto carnet; y la casilla, un cuadrado de 1.3rem con borde de 2px en tinta y fondo de tarjeta blanca que se tilda en birome, que reemplaza tanto al casillero impreso de Tratamientos como al control redondo del navegador en las opciones de obra social y el consentimiento. Lo apoyado se gira apenas: la tarjeta -1° (-2° desde lg en el hero), la foto -2°, los sellos entre -4° y -9°; un sello nunca queda derecho.

### Named Rules
**The Esquinas Vivas Rule.** Ningún botón, tarjeta, chip, campo, casilla ni foco se redondea. El foco es un contorno de 2px en tinta de sello a 2px de distancia, sin radio, que sigue la esquina recta del elemento.

**The Casilla Cuadrada Rule.** Toda casilla de verificación y toda opción única se dibujan con la utilidad `casilla`: cuadrado de 2px tildado en birome. El radio y el relleno redondo del control nativo son lo único del sitio que vendría con esquinas redondeadas, y por eso se reemplazan.

## Components

### Buttons
Bloques de tinta y contornos impresos que se hunden como un sello al apretarlos.
- **Shape:** esquinas vivas (0), borde de 2px siempre presente para que el relleno y el contorno midan igual.
- **Primary («Sacar turno»):** bloque en tinta de sello con texto blanco, 700, 0.875rem x 1.75rem en el hero (1.15rem de texto) y más compacto en el encabezado. Hay uno por vista y es siempre la acción de reservar.
- **Primary de ancho completo:** el mismo bloque a todo el ancho, 1rem x 1.25rem, 1.15rem: es el «Confirmar turno · 16:00» del último paso, el único botón que cierra el trámite. Deshabilitado baja a 60% de opacidad y el texto pasa a «Confirmando…».
- **Hover / Active:** hover pasa a sello cargado; al apretar baja 2px (y escala a 0.995 el de ancho completo) en 100ms. Foco con el contorno de sello de 2px.
- **Contorno en tinta:** borde de 2px en tinta, texto en tinta; hover llena de tarjeta blanca (hero: llamar, WhatsApp) o de tinta con texto blanco (Abrir en Google Maps).
- **Contorno de sello:** borde de 2px en sello, texto en sello; hover llena de sello con texto blanco. Para «Sacar turno con …» y para el «Ver horarios» de cada renglón de profesional, que se llena cuando el mouse está sobre el renglón entero.
- **Contorno de aviso:** borde y texto en rojo de aviso, ancho completo; hover llena de rojo con texto blanco. Sólo para cancelar un turno, la única acción destructiva del sitio.
- **Enlace de texto:** para volver atrás sin peso («Cambiar de profesional», «Cambiar día y hora», «Cambiar»): texto en tinta suave a 0.95rem subrayado en color renglón a 4px de distancia, que pasa a tinta al hover. No es un botón y no lleva borde.

### Chips
Las opciones de día y de horario son fichas impresas, no píldoras.
- **Style:** borde de 2px en color renglón sobre tarjeta blanca, esquinas vivas. El día lleva el nombre corto en versalitas angostas (0.95rem, 0.08em), la cantidad de horarios en 0.8rem y, si hace falta, la sede en versalitas de 0.75rem en tinta de sello; el horario lleva la hora en 1.15rem 700 con cifras tabulares y área de toque generosa (0.75rem x 1rem / 1rem x 0.75rem).
- **State:** elegido = bloque lleno en tinta de sello con texto blanco y las líneas secundarias al 85% de blanco; sin elegir, hover sólo cambia el borde a sello. Al apretar baja 2px, igual que los botones. El estado se declara con `aria-pressed`.

### Cards / Containers
- **Tarjeta de turno (firma):** tarjeta blanca de hasta 28rem, girada -1°, con la única sombra del sitio. Encabezado con isotipo y nombre en versalitas angostas, marca «Turno» en numerador y raya doble de 5px; renglones de 1px en color renglón con rótulo impreso a la izquierda y dato en birome a la derecha, alineado a la derecha, con una nota opcional en letra chica debajo (la sede, el título de la profesional); troquel con muescas de cartulina y talón en el home. Es la misma pieza en el hero y en los cinco momentos del mostrador: arranca con los renglones vacíos hablando en birome suave y se va completando. Cuando el turno queda resuelto, el sello cae en la esquina baja derecha y la tarjeta reserva 4rem de aire abajo para recibirlo.
- **Tarjeta de sede:** tarjeta blanca con filete de 1px en tinta, sin sombra ni radio; croquis arriba cerrado por raya doble, dirección como título ancho con la altura en numerador, 1.25 a 1.75rem de relleno, botón al fondo alineado entre tarjetas.
- **Aviso:** recuadro de 2px de borde y 1.25rem de relleno con el título en 1.15rem 700 y el cuerpo en tinta suave; neutro sobre cartulina a la sombra, de error con borde rojo de aviso y fondo al 5%, de éxito con borde verde y fondo al 5%. Lleva `role="status"`. Es lo que dice «Por ahora no hay turnos online» o «Ese horario ya no está libre».
- **Recuadro del enlace de cancelación:** tarjeta blanca con borde de 2px en tinta, 1.25 a 1.5rem de relleno, título ancho a 1.35rem; es el único plano blanco de la pantalla de confirmación porque la tarjeta vive al costado.

### Inputs / Fields
- **Style:** etiqueta en versalitas angostas de rótulo, campo de borde 2px en color renglón sobre tarjeta blanca, esquinas vivas, 0.75rem x 0.875rem, texto a 1.05rem. La ayuda va debajo en 0.95rem en tinta suave. Lo opcional se dice en la etiqueta («(opcional)»), en redonda y minúscula.
- **Focus:** el contorno de sello de 2px a 2px de distancia, igual que todo el sitio; el cursor de texto es azul birome.
- **Error:** el borde pasa a rojo de aviso y debajo aparece el texto del error en 0.95rem 700 en rojo, dentro de una región `aria-live` que ya existía vacía. El color nunca va solo: siempre hay texto.
- **Opción única (obra social):** cada opción es un bloque de 2px sobre tarjeta blanca, 1rem x 0.875rem, con la casilla cuadrada a la izquierda; elegida, el borde y el texto pasan a tinta de sello. El grupo se abre con un `legend` en versalitas.
- **Consentimiento:** casilla cuadrada arriba de un párrafo de 0.95rem, separado del formulario por un renglón de 1px.
- **Formulario:** se abre con una raya de 2px en tinta a todo el ancho y respira con 1.75rem entre campos; los campos cortos van de a dos desde sm. Sin panel blanco alrededor.

### Navigation
Encabezado fijo sobre cartulina al 95% con filete inferior de 2px en tinta. Marca a la izquierda: isotipo en sello y nombre en versalitas angostas 800. En escritorio los enlaces van en Archivo 500 a 0.95rem en tinta suave, tinta en hover, y el activo en sello subrayado a 2px con 6px de separación. «Sacar turno» siempre visible a la derecha. En el teléfono un botón de dos barras que se cruzan abre una lista de renglones a 1.05rem con el activo en sello; debajo de 390px el nombre se apila en dos líneas.

### Mostrador (firma)
Las piezas compartidas por los tres pasos, la confirmación y la cancelación.
- **Columna fija:** la tarjeta del turno y, debajo, la lista de lo que falta.
- **Pendientes:** lista numerada a 0.95rem, números en versalitas angostas con cifras tabulares; lo hecho va tachado en tinta suave, el paso actual en negrita y tinta de imprenta, lo que viene en tinta suave. Sólo desde lg, con `aria-current="step"`.
- **Encabezado de paso:** la pregunta en ancho 800 (clamp(1.75rem, 6vw, 2.6rem)) y debajo la línea de hasta 52ch que arranca con «Paso N de 3.» en negrita. Sin antetítulo y sin píldora de pasos.
- **Tira del teléfono:** barra fija bajo el encabezado del sitio, cartulina al 95% con desenfoque y renglón de 1px abajo; muestra sólo los renglones ya completados (rótulo en versalitas de 0.75rem, dato en birome a 1.05rem) y, si hace falta, un enlace de texto para corregir.
- **Elegir con quién:** filas de la hoja, no tarjetas: renglones de 1px donde el nombre va en ancho 800 (clamp(1.4rem, 5vw, 1.9rem)), la letra chica debajo en tinta suave y el botón de contorno de sello a la derecha; el renglón entero es el enlace y se llena al hover.
- **Fecha de renglón:** en la tarjeta la fecha se escribe siempre en la forma corta («jue 17 sept»), sin punto ni coma, porque es la única que entra en un renglón.

### Sello
Marco doble en tinta de sello (3px, 3px de aire, 1px), versalitas angostas, siempre girado y con `mix-blend-multiply` para que la tinta se asiente sobre lo de abajo. Tinta plana, sin grano simulado: se reconoce por la forma y se lee entero. Es HTML, no imagen. Cae una sola vez por página, con la animación `sellar`: en el home sobre la tarjeta del hero, en el mostrador sólo al final («Confirmado» en tinta de sello, «Cancelado» en rojo de aviso, ambos a -8°). En profesionales, el nombre dentro del sello es el título de la ficha.

### Renglones y listas
- **Tratamientos:** filas separadas por renglón de 1px, 1.5rem de aire, con una casilla impresa ya tildada en birome (no es un control) y el nombre como title.
- **Preguntas frecuentes:** `details` nativos a todo el ancho separados por renglón, pregunta en 600 a 1.05rem que pasa a sello en hover, cruz SVG en sello que gira 45° en 300ms al abrir. La respuesta ocupa el mismo ancho que la pregunta, sin tope de medida.

### Croquis de sede
SVG propio generado desde OpenStreetMap, impreso con la paleta de la cartulina: suelo cartulina a la sombra, calles casi blancas, avenidas tarjeta blanca, plazas y agua en azules grises, bordes color renglón, nombres en tinta con halo blanco y el pin en numerador.

## Do's and Don'ts

### Do:
- **Do** tratar cada pantalla como una pieza impresa sobre cartulina (background) con, a lo sumo, una tarjeta blanca (surface) apoyada.
- **Do** separar secciones con la fila de troquel y abrir cada una con título ancho (wdth 118, 800) y raya doble de 5px en tinta.
- **Do** escribir en birome (Kalam, birome) los datos reales que completan un renglón, a 1rem o más.
- **Do** dejar hablar al renglón vacío en birome suave («lo elegís vos», «tus datos») en lugar de poner un guión o dejarlo en blanco.
- **Do** poner las alturas de las direcciones en rojo numerador, en negrita y con cifras tabulares.
- **Do** dar a cada botón y a cada chip borde de 2px, esquinas vivas y el hundimiento de 2px / 0.985 en 100ms.
- **Do** usar la utilidad `casilla` para toda casilla y toda opción única, y dejar el tilde en birome.
- **Do** mantener a la vista lo ya decidido en un flujo de varios pasos: tarjeta al costado en escritorio, tira fija arriba en el teléfono, y una salida de texto para corregirlo.
- **Do** decir el paso dentro de la frase que sigue al título, en negrita, y repetirlo en la lista numerada al costado.
- **Do** girar lo apoyado (tarjeta, foto, sellos) entre -1° y -9°, y dejar derecho todo lo impreso.
- **Do** reservar la animación `sellar` (520ms, cubic-bezier(0.16, 1, 0.3, 1), 380ms de espera) para un único sello por página, y dejarlo quieto con movimiento reducido.

### Don't:
- **Don't** usar foto de stock, celeste genérico de clínica ni tarjetas con íconos.
- **Don't** redondear esquinas; `rounded-full` sólo para las muescas del troquel de la tarjeta.
- **Don't** dejar los controles redondos del navegador: la casilla es cuadrada y se tilda en birome.
- **Don't** agregar sombras fuera de la tarjeta de turno, ni sombras duras desplazadas.
- **Don't** poner dos planos blancos grandes en la misma pantalla; los campos blancos van sobre la cartulina, sin panel.
- **Don't** usar Kalam para párrafos, botones, navegación o rótulos.
- **Don't** usar rojo numerador para texto corrido, fondos o botones, ni rojo de aviso / verde confirmado como relleno de un botón principal.
- **Don't** poner antetítulos en versalitas encima de los títulos; las versalitas son rótulos de campo o de grupo de campos.
- **Don't** marcar el avance con una píldora de pasos ni con una barra de progreso: el paso se lee en la frase y en la lista numerada.
- **Don't** simular grano, manchas ni bordes corridos en los sellos; la tinta es plana.
- **Don't** separar secciones con fondos alternados o bandas de color.
