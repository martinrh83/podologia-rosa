/**
 * Genera los mapas de la sección "Cómo llegar": public/maps/<sede>.svg.
 *
 *   node scripts/generate-maps.mjs
 *
 * Se corre a mano, una vez y cada vez que una sede se mude. El sitio nunca le
 * pide nada a OpenStreetMap: sirve los archivos que deja este script.
 *
 * POR QUÉ NO SNAZZY MAPS
 *
 *   Snazzy exporta un mapa de Google con otro estilo, y las condiciones de
 *   Google no permiten guardar esa imagen y servirla desde nuestro dominio. Los
 *   datos de OpenStreetMap sí se pueden usar (ODbL) con la atribución
 *   "© OpenStreetMap", que va impresa en cada mapa.
 *
 *   El estilo sí sale de Snazzy: los colores están medidos de las imágenes que
 *   se exportaron ahí.
 *
 * Diseño completo: docs/plans/2026-09-17-mapas-como-llegar-design.md
 *
 * Si se agrega o muda una sede, también hay que tocar src/lib/maps.ts: la
 * dirección es la que une cada mapa con su sede.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const LOCATIONS = [
  {
    // Coordenada de la búsqueda de la dirección en OpenStreetMap.
    file: "centro.svg",
    lat: -24.7838486,
    lon: -65.4103841,
  },
  {
    // OpenStreetMap no tiene la altura 1130 de Olavarría: la coordenada sale
    // del link de Google Maps de la sede.
    file: "san-jose.svg",
    lat: -24.8031466,
    lon: -65.4337285,
  },
];

const WIDTH = 600;
const HEIGHT = 400;
/** Metros de terreno por unidad del viewBox: 960 × 640 m, unas 7 cuadras por 5. */
const METERS_PER_UNIT = 1.6;

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const USER_AGENT = "podologia-mitre-maps/1.0 (generación única de mapas estáticos)";

const COLORS = {
  ground: "#d3e4eb",
  street: "#ededed",
  avenue: "#fcfcfc",
  park: "#cdf2dd",
  water: "#53c8f0",
  shore: "#cccccc",
  label: "#1f2f38",
  halo: "#ffffff",
  pin: "#0055a4",
};

/** Ancho de cada tipo de calle, en unidades del viewBox. */
const ROAD_WIDTHS = {
  trunk: 14,
  primary: 13,
  secondary: 12,
  tertiary: 9,
  unclassified: 8,
  residential: 8,
  living_street: 6,
  pedestrian: 5,
};
const AVENUES = new Set(["trunk", "primary", "secondary"]);

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const LABEL_SIZE = 18;

// ---------------------------------------------------------------------------
// Proyección
// ---------------------------------------------------------------------------

/** Web Mercator local: alcanza y sobra para menos de un kilómetro. */
function projector({ lat, lon }) {
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLon = 111_320 * Math.cos((lat * Math.PI) / 180);
  return ({ lat: pointLat, lon: pointLon }) => [
    WIDTH / 2 + ((pointLon - lon) * metersPerDegreeLon) / METERS_PER_UNIT,
    HEIGHT / 2 - ((pointLat - lat) * metersPerDegreeLat) / METERS_PER_UNIT,
  ];
}

function boundingBox({ lat, lon }, marginFactor) {
  const halfWidth = (WIDTH / 2) * METERS_PER_UNIT * marginFactor;
  const halfHeight = (HEIGHT / 2) * METERS_PER_UNIT * marginFactor;
  const dLat = halfHeight / 111_320;
  const dLon = halfWidth / (111_320 * Math.cos((lat * Math.PI) / 180));
  return `${lat - dLat},${lon - dLon},${lat + dLat},${lon + dLon}`;
}

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------

async function fetchFeatures(location) {
  // Más grande que lo visible para que las calles y las plazas no se corten
  // justo en el borde; el SVG recorta lo que sobra.
  const bbox = boundingBox(location, 1.4);
  const highways = Object.keys(ROAD_WIDTHS).join("|");
  const query = `
    [out:json][timeout:30];
    (
      way["highway"~"^(${highways})$"](${bbox});
      way["leisure"="park"](${bbox});
      relation["leisure"="park"](${bbox});
      way["natural"="water"](${bbox});
      relation["natural"="water"](${bbox});
      way["natural"~"^(scrub|sand|shingle|bare_rock)$"](${bbox});
    );
    out geom;
  `;
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data: query }),
  });
  if (!response.ok) {
    throw new Error(`Overpass respondió ${response.status}: ${await response.text()}`);
  }
  const { elements } = await response.json();
  return elements;
}

// ---------------------------------------------------------------------------
// Geometría
// ---------------------------------------------------------------------------

/** Zona de recorte: un poco más grande que el viewBox, para no ver los bordes. */
const CLIP = { minX: -30, minY: -30, maxX: WIDTH + 30, maxY: HEIGHT + 30 };

/** Sutherland–Hodgman contra un rectángulo. Sirve para anillos cóncavos. */
function clipRing(ring, box) {
  const edges = [
    [(p) => p[0] >= box.minX, (a, b) => intersectX(a, b, box.minX)],
    [(p) => p[0] <= box.maxX, (a, b) => intersectX(a, b, box.maxX)],
    [(p) => p[1] >= box.minY, (a, b) => intersectY(a, b, box.minY)],
    [(p) => p[1] <= box.maxY, (a, b) => intersectY(a, b, box.maxY)],
  ];
  let output = ring;
  for (const [inside, intersect] of edges) {
    const input = output;
    output = [];
    for (let i = 0; i < input.length; i++) {
      const current = input[i];
      const previous = input[(i + input.length - 1) % input.length];
      if (inside(current)) {
        if (!inside(previous)) output.push(intersect(previous, current));
        output.push(current);
      } else if (inside(previous)) {
        output.push(intersect(previous, current));
      }
    }
    if (output.length === 0) break;
  }
  return output;
}

function intersectX(a, b, x) {
  const t = (x - a[0]) / (b[0] - a[0]);
  return [x, a[1] + t * (b[1] - a[1])];
}

function intersectY(a, b, y) {
  const t = (y - a[1]) / (b[1] - a[1]);
  return [a[0] + t * (b[0] - a[0]), y];
}

/** Liang–Barsky por segmento: devuelve los tramos de la línea dentro de la caja. */
function clipLine(line, box) {
  const pieces = [];
  let piece = [];
  for (let i = 0; i < line.length - 1; i++) {
    const segment = clipSegment(line[i], line[i + 1], box);
    if (!segment) {
      if (piece.length > 1) pieces.push(piece);
      piece = [];
      continue;
    }
    const [start, end] = segment;
    const last = piece[piece.length - 1];
    if (!last || last[0] !== start[0] || last[1] !== start[1]) {
      if (piece.length > 1) pieces.push(piece);
      piece = [start];
    }
    piece.push(end);
  }
  if (piece.length > 1) pieces.push(piece);
  return pieces;
}

function clipSegment([x0, y0], [x1, y1], box) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  let t0 = 0;
  let t1 = 1;
  const checks = [
    [-dx, x0 - box.minX],
    [dx, box.maxX - x0],
    [-dy, y0 - box.minY],
    [dy, box.maxY - y0],
  ];
  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return null;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return null;
      if (t < t1) t1 = t;
    }
  }
  return [
    [x0 + t0 * dx, y0 + t0 * dy],
    [x0 + t1 * dx, y0 + t1 * dy],
  ];
}

/** Descarta puntos casi pegados al anterior: no se ven y engordan el archivo. */
function simplify(points, minDistance = 1) {
  const result = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const last = result[result.length - 1];
    if (Math.hypot(points[i][0] - last[0], points[i][1] - last[1]) >= minDistance) {
      result.push(points[i]);
    }
  }
  if (points.length > 1) result.push(points[points.length - 1]);
  return result;
}

/** Une tramos que comparten extremos: una calle en OSM viene partida en muchos. */
function joinChains(lines) {
  const chains = lines.map((line) => [...line]);
  const same = (a, b) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < chains.length; i++) {
      for (let j = i + 1; j < chains.length; j++) {
        const a = chains[i];
        const b = chains[j];
        let joined = null;
        if (same(a[a.length - 1], b[0])) joined = [...a, ...b.slice(1)];
        else if (same(a[a.length - 1], b[b.length - 1])) joined = [...a, ...b.reverse().slice(1)];
        else if (same(a[0], b[b.length - 1])) joined = [...b, ...a.slice(1)];
        else if (same(a[0], b[0])) joined = [...b.reverse(), ...a.slice(1)];
        if (joined) {
          chains[i] = joined;
          chains.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  return chains;
}

function lineLength(line) {
  let length = 0;
  for (let i = 1; i < line.length; i++) {
    length += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
  }
  return length;
}

const round = (n) => Math.round(n * 10) / 10;

function pathData(points, closed) {
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${round(x)} ${round(y)}`).join("");
  return closed ? `${d}Z` : d;
}

/** Los anillos de un polígono o multipolígono de Overpass, ya proyectados. */
function rings(element, project) {
  if (element.type === "way") {
    return [element.geometry.map(project)];
  }
  const members = element.members.filter((member) => member.type === "way" && member.geometry);
  return joinChains(members.map((member) => member.geometry.map(project)));
}

// ---------------------------------------------------------------------------
// Nombres de calles
// ---------------------------------------------------------------------------

/**
 * Como se dicen en Salta, que es como figuran en las direcciones. OSM trae el
 * nombre completo del prócer y en un mapa chico eso es ruido.
 */
const SHORT_NAMES = {
  "Antonio Balcarce": "Balcarce",
  "Avenida 20 de Junio": "Av. 20 de Junio",
  "Avenida Costanera": "Av. Costanera",
  "Avenida Entre Ríos": "Av. Entre Ríos",
  "Coronel Jorge Vidt": "Cnel. Vidt",
  "Bernardino Rivadavia": "Rivadavia",
  "Diagonal 9 de Julio": "Diag. 9 de Julio",
  "Facundo de Zuviría": "Zuviría",
  "Fray Luis Beltrán": "Beltrán",
  "José Valentín de Olavarría": "Olavarría",
  "Juan Larrea": "Larrea",
  "Juan Martín Leguizamón": "Leguizamón",
  "Miguel de Azcuénaga": "Azcuénaga",
};

/** Lo que tapa el pin, relativo a su punta: el globo sube unas 55 unidades. */
const PIN_BOX = { minX: -26, minY: -62, maxX: 26, maxY: 10 };

/**
 * Un nombre por calle, sin pisar otros nombres ni el pin. Primero las calles de
 * la sede —son las que la gente busca—, después las avenidas y después las más
 * largas. Cada nombre prueba varias posiciones a lo largo de su tramo, empezando
 * por la mitad: en las calles de la sede la mitad cae justo debajo del pin.
 *
 * Largo del texto estimado: sin un motor de fuentes no hay medida exacta, y
 * 0.58 em por carácter sobra para system-ui.
 */
function placeLabels(roads) {
  const LABEL_BOX = { minX: 8, minY: 8, maxX: WIDTH - 8, maxY: HEIGHT - 8 };
  const pin = [WIDTH / 2, HEIGHT / 2];

  const byName = new Map();
  for (const road of roads) {
    if (!road.name) continue;
    const list = byName.get(road.name) ?? [];
    list.push(road);
    byName.set(road.name, list);
  }

  const candidates = [];
  for (const [name, list] of byName) {
    const chains = joinChains(list.map((road) => road.points));
    for (const chain of chains) {
      for (const piece of clipLine(chain, LABEL_BOX)) {
        candidates.push({
          text: SHORT_NAMES[name] ?? name,
          points: piece,
          length: lineLength(piece),
          avenue: list.some((road) => road.avenue),
          atPin: distanceToLine(pin, piece) < 20,
        });
      }
    }
  }
  candidates.sort(
    (a, b) =>
      Number(b.atPin) - Number(a.atPin) ||
      Number(b.avenue) - Number(a.avenue) ||
      b.length - a.length,
  );

  const placed = [];
  const taken = [];
  const labeled = new Set();
  const halfHeight = LABEL_SIZE * 0.7;
  const blockedByPin = ([x, y]) =>
    x > pin[0] + PIN_BOX.minX - halfHeight &&
    x < pin[0] + PIN_BOX.maxX + halfHeight &&
    y > pin[1] + PIN_BOX.minY - halfHeight &&
    y < pin[1] + PIN_BOX.maxY + halfHeight;

  for (const candidate of candidates) {
    if (labeled.has(candidate.text)) continue;
    const textLength = candidate.text.length * LABEL_SIZE * 0.58;
    const room = candidate.length - textLength - 24;
    if (room < 0) continue;

    let points = candidate.points;
    const start = points[0];
    const end = points[points.length - 1];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    // Que se lea de izquierda a derecha, y de abajo hacia arriba en las verticales.
    if (dx < -Math.abs(dy) * 0.05 || (Math.abs(dx) <= Math.abs(dy) * 0.05 && dy > 0)) {
      points = [...points].reverse();
    }

    for (const shift of [0, -0.25, 0.25, -0.5, 0.5]) {
      const center = candidate.length / 2 + shift * room;
      const samples = sampleAround(points, center, textLength);
      const clear = samples.every(
        (sample) =>
          !blockedByPin(sample) &&
          taken.every(([tx, ty]) => Math.hypot(sample[0] - tx, sample[1] - ty) > LABEL_SIZE * 1.4),
      );
      if (!clear) continue;
      taken.push(...samples);
      labeled.add(candidate.text);
      placed.push({ text: candidate.text, points, offset: center });
      break;
    }
  }
  return placed;
}

function distanceToLine([px, py], line) {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1];
    const [x1, y1] = line[i];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / lengthSquared));
    best = Math.min(best, Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy)));
  }
  return best;
}

/** Puntos a lo largo del tramo que ocuparía un texto centrado en `center`. */
function sampleAround(points, center, textLength) {
  const samples = [];
  for (let offset = center - textLength / 2; offset <= center + textLength / 2; offset += LABEL_SIZE / 2) {
    samples.push(pointAt(points, offset));
  }
  return samples;
}

function pointAt(points, distance) {
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const segment = Math.hypot(x1 - x0, y1 - y0);
    if (walked + segment >= distance) {
      const t = segment === 0 ? 0 : (distance - walked) / segment;
      return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
    }
    walked += segment;
  }
  return points[points.length - 1];
}

// ---------------------------------------------------------------------------
// SVG
// ---------------------------------------------------------------------------

const escapeXml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function render(location, elements) {
  const project = projector(location);

  const areas = { shore: [], park: [], water: [] };
  const roads = [];

  for (const element of elements) {
    const tags = element.tags ?? {};
    if (tags.highway && element.type === "way") {
      roads.push({
        name: tags.name,
        width: ROAD_WIDTHS[tags.highway],
        avenue: AVENUES.has(tags.highway),
        points: element.geometry.map(project),
      });
      continue;
    }
    const kind =
      tags.natural === "water" ? "water" : tags.leisure === "park" ? "park" : tags.natural ? "shore" : null;
    if (!kind) continue;
    for (const ring of rings(element, project)) {
      const clipped = clipRing(ring, CLIP);
      if (clipped.length >= 3) areas[kind].push(pathData(simplify(clipped), true));
    }
  }

  const areaPaths = (kind) =>
    areas[kind].length
      ? `<path fill="${COLORS[kind]}" fill-rule="evenodd" d="${areas[kind].join("")}"/>`
      : "";

  // Calles comunes abajo, avenidas arriba: en los cruces manda la avenida.
  const roadGroups = new Map();
  for (const road of [...roads].sort((a, b) => a.width - b.width)) {
    const key = `${road.avenue ? COLORS.avenue : COLORS.street}|${road.width}`;
    const d = clipLine(road.points, CLIP)
      .map((piece) => pathData(simplify(piece), false))
      .join("");
    if (d) roadGroups.set(key, (roadGroups.get(key) ?? "") + d);
  }
  const roadPaths = [...roadGroups]
    .map(([key, d]) => {
      const [color, width] = key.split("|");
      return `<path stroke="${color}" stroke-width="${width}" d="${d}"/>`;
    })
    .join("");

  const labels = placeLabels(roads);
  const labelDefs = labels
    .map((label, i) => `<path id="l${i}" d="${pathData(simplify(label.points), false)}"/>`)
    .join("");
  const labelText = labels
    .map(
      (label, i) =>
        `<text><textPath href="#l${i}" startOffset="${round(label.offset)}">${escapeXml(label.text)}</textPath></text>`,
    )
    .join("");

  const [pinX, pinY] = [WIDTH / 2, HEIGHT / 2];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.ground}"/>
${areaPaths("shore")}
${areaPaths("park")}
${areaPaths("water")}
<g fill="none" stroke-linecap="round" stroke-linejoin="round">${roadPaths}</g>
<defs>${labelDefs}</defs>
<g font-family="${FONT}" font-size="${LABEL_SIZE}" font-weight="600" text-anchor="middle" dominant-baseline="central" fill="${COLORS.label}" stroke="${COLORS.halo}" stroke-width="3" stroke-linejoin="round" paint-order="stroke">${labelText}</g>
<g transform="translate(${pinX} ${pinY}) scale(1.3)">
<ellipse cy="1" rx="7" ry="2.5" fill="#15191e" opacity=".25"/>
<path d="M0 0C-3-9-14-15-14-26A14 14 0 0 1 14-26C14-15 3-9 0 0Z" fill="${COLORS.pin}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
<circle cy="-26" r="5" fill="#fff"/>
</g>
<g font-family="${FONT}" font-size="13" fill="#5b6472">
<rect x="${WIDTH - 122}" y="${HEIGHT - 22}" width="122" height="22" fill="#fff" opacity=".8"/>
<text x="${WIDTH - 7}" y="${HEIGHT - 7}" text-anchor="end">© OpenStreetMap</text>
</g>
</svg>
`;
}

// ---------------------------------------------------------------------------

const outputDir = path.join(import.meta.dirname, "..", "public", "maps");
await mkdir(outputDir, { recursive: true });

for (const [index, location] of LOCATIONS.entries()) {
  // La API de Overpass es compartida: una pausa entre pedidos.
  if (index > 0) await new Promise((resolve) => setTimeout(resolve, 5_000));
  const elements = await fetchFeatures(location);
  const svg = render(location, elements);
  await writeFile(path.join(outputDir, location.file), svg);
  console.log(`${location.file}: ${elements.length} elementos, ${(svg.length / 1024).toFixed(1)} KB`);
}
