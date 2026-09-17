# Mapas en "Cómo llegar"

Un mapa por sede en la sección `#directions` del home, generado una vez con
datos de OpenStreetMap y servido como SVG desde nuestro dominio.

## Por qué no las imágenes de Snazzy Maps

Snazzy Maps no dibuja mapas: exporta un mapa de Google con otro estilo. Las
condiciones de Google Maps Platform prohíben guardar esas imágenes y servirlas
desde otro dominio. Además traían impresos controles que no funcionan
("Keyboard shortcuts", "Report a map error") y no marcaban el consultorio.

También se descartan:

- **La API de mapas estáticos de Google en vivo.** Es legal, pero Google se
  entera de cada visita, que es lo que la página de privacidad quiere evitar.
- **El iframe de Google y Leaflet.** Por lo mismo, ya documentado en
  `src/components/home/directions.tsx`.

Los datos de OpenStreetMap se pueden usar libremente (ODbL) con la atribución
"© OpenStreetMap".

## Sedes

| Sede     | Dirección             | Coordenadas          | Fuente                           |
|----------|-----------------------|----------------------|----------------------------------|
| Centro   | Bartolomé Mitre 496   | -24.78385, -65.41038 | Búsqueda en OpenStreetMap        |
| San José | Olavarría 1130        | -24.80315, -65.43373 | Link de Google Maps de la sede   |

OpenStreetMap no tiene la altura 1130 de Olavarría; por eso la coordenada sale
del link que se pasó para esa sede.

## 1. Cómo se muestra

`<Image>` de `next/image` con un `.svg` en `public/maps/`, no un SVG escrito
dentro del componente:

- **Peso del home.** Cada mapa pesa unos 20 a 40 KB. Dentro del componente
  viajaría en el HTML de cada visita, aunque nadie baje hasta la sección. Como
  archivo aparte, el navegador lo guarda en caché.
- **Carga diferida.** `<Image>` trae `loading="lazy"` por defecto.
- **Sin saltos.** `width={600} height={400}` reservan el espacio.

Cuando el `src` termina en `.svg`, `<Image>` no procesa el archivo y lo sirve
tal cual: no hay que tocar `next.config.ts` ni habilitar `dangerouslyAllowSVG`.
Se prefiere a `<img>` para no desactivar la regla `@next/next/no-img-element`.

### Vínculo sede ↔ mapa: por dirección

```ts
// src/lib/maps.ts
const MAPS: Record<string, { src: string; alt: string }> = {
  "bartolome mitre 496": {
    src: "/maps/centro.svg",
    alt: "Mapa: Bartolomé Mitre 496, entre Entre Ríos y Santiago del Estero",
  },
  "olavarria 1130": { src: "/maps/san-jose.svg", alt: "Mapa: Olavarría 1130, …" },
};
```

`normalizeAddress` pasa a minúsculas, saca tildes, junta los espacios y descarta
lo que venga después de la primera coma. "Bartolomé Mitre 496, Salta" y
"bartolome mitre 496" dan la misma clave.

Se eligió la dirección, no el nombre ni un `slug` nuevo en `locations`, porque el
mapa depende de la dirección. Si Rosa la cambia desde el panel, el mapa deja de
mostrarse en vez de marcar el lugar viejo. No hace falta ninguna migración.

El `alt` nombra las calles que la cruzan: para un lector de pantalla, eso es lo
que el mapa aporta.

## 2. Cómo se generan los SVG

`scripts/generate-maps.mjs`, commiteado y sin dependencias (usa el `fetch` de
Node). Se corre a mano, una vez y cada vez que una sede se mude:

```
node scripts/generate-maps.mjs   →   public/maps/centro.svg, public/maps/san-jose.svg
```

Las sedes (clave, coordenadas y archivo de salida) están definidas en el script.
Para cada una:

1. Pide a la API Overpass de OpenStreetMap las calles (`highway`), las plazas
   (`leisure=park`), el agua (`natural=water`, `waterway`) y la costa, en un
   recuadro de unos 600 × 400 m centrado en la sede.
2. Proyecta las coordenadas con Web Mercator a un `viewBox="0 0 600 400"` y las
   redondea a un decimal.
3. Escribe el SVG.

La API es gratuita y compartida: un pedido por sede, con una pausa entre los
dos. El sitio nunca la consulta en producción.

### Estilo

Tomado de los PNG exportados de Snazzy Maps, con los colores medidos de las
imágenes. Van fijos en el SVG porque una imagen no ve las variables CSS de la
página. El sitio tiene un solo tema claro, así que no hace falta más.

| Elemento             | Color                       | Nota                                     |
|----------------------|-----------------------------|------------------------------------------|
| Fondo (manzanas)     | `#d3e4eb`                   |                                          |
| Calles               | `#ededed`                   |                                          |
| Avenidas             | `#fcfcfc`, más anchas       | `primary`, `secondary`, `trunk`          |
| Plazas               | `#cdf2dd`                   |                                          |
| Río                  | `#53c8f0`                   |                                          |
| Costa                | `#cccccc`                   |                                          |
| Nombres de calles    | `#1f2f38` con halo blanco   | A lo largo de la calle, solo las largas  |
| Pin                  | `#0055a4` con borde blanco  | `--accent`, lo único de color fuerte     |
| Atribución           | "© OpenStreetMap"           | Esquina inferior derecha                 |

Tipografía `system-ui`: la imagen no puede cargar la fuente del sitio.

Ajustes que salieron de verlo en el navegador:

- **Tamaño.** En un teléfono la tarjeta mide unos 354 px, así que el mapa se ve
  a 0,6×. Los nombres van a 18 unidades (unos 11 px en el teléfono) y el pin a
  1,3×: con 14 unidades los nombres quedaban de 8 px.
- **Nombres cortos.** OSM trae el nombre completo ("José Valentín de Olavarría",
  "Bernardino Rivadavia"). El script tiene una tabla `SHORT_NAMES` con el nombre
  como se dice en Salta, que es como figura en las direcciones.
- **Las calles de la sede primero.** Su nombre se ubica antes que el resto y
  prueba varias posiciones a lo largo de la calle: en el medio está el pin.

Queda afuera del estilo de Snazzy:

- **Hospitales y otros puntos de interés.** Compiten con el pin; para ubicarse
  alcanzan las plazas y las avenidas.
- **Las flechas de mano única.** Son ruido en un mapa de 600×400 en un teléfono.

## 3. La sección

```
Cómo llegar
[tarjeta Centro]   [tarjeta San José]     ← sm:grid-cols-2, apiladas en teléfono
Teléfono / WhatsApp │ Horarios            ← las dos columnas de hoy, sin cambios
```

Cada tarjeta tiene borde `--border`, fondo `--surface` y esquinas rectas:

1. El mapa, del ancho de la tarjeta, en proporción 3:2 y enlazado a `map_url`.
2. El nombre de la sede, en mayúsculas y color de acento.
3. La dirección.
4. El botón "Cómo llegar en Google Maps".

### Casos límite

- **La sede no tiene mapa**, porque la dirección no coincide o la sede es nueva:
  la tarjeta queda solo con el texto, sin mapa de relleno. Si las dos tarjetas
  quedan de distinto alto, es transitorio: se arregla corriendo el script.
- **Hay una sola sede:** una tarjeta de media columna en escritorio, para que el
  mapa no quede estirado.
- **Falta `map_url`:** el mapa se muestra sin enlace y no aparece el botón.

El comentario "EL MAPA" de `directions.tsx` se actualiza con esta decisión.

## 4. Pruebas

- **`src/lib/maps.test.ts` (Vitest):**
  - la clave ignora mayúsculas, tildes y espacios de más;
  - "Bartolomé Mitre 496, Salta" da la misma clave que "bartolome mitre 496";
  - una dirección desconocida no devuelve mapa;
  - cada `src` de la tabla existe en `public/`, así un archivo renombrado rompe el
    test y no el sitio.
- **En el navegador, con `next dev`:** la sección en escritorio y en teléfono,
  que no haya saltos al cargar, que el pin caiga en la cuadra correcta y que el
  pin se distinga del río en San José.
