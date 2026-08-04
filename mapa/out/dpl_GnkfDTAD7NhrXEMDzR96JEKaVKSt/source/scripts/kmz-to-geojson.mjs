/**
 * Convierte el KMZ (o KML) oficial de la traza en `public/data/traza.geojson`,
 * que es el archivo que el mapa usa si existe.
 *
 *   npm run traza -- ruta/al/trazado.kmz
 *   npm run traza -- ruta/al/trazado.kml --tolerancia 0.0005
 *
 * Además lista los Placemark de tipo Point que encuentre, con su nombre y sus
 * coordenadas: sirve para corregir las posiciones de las estaciones de bombeo
 * en `src/data/traza.ts`, que hoy son aproximadas.
 *
 * Sin dependencias: un KMZ es un ZIP y su contenido es XML, así que se
 * descomprime a mano con `zlib` y se lee con expresiones regulares. Es acotado
 * y suficiente para este formato; no pretende ser un parser de KML general.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(raiz, "public", "data", "traza.geojson");

/* ------------------------------------------------------------------ */
/* Argumentos                                                          */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const entrada = args.find((a) => !a.startsWith("--"));

if (!entrada) {
  console.error("Uso: npm run traza -- <archivo.kmz|archivo.kml> [--tolerancia 0.0002]");
  process.exit(1);
}

const iTolerancia = args.indexOf("--tolerancia");
// ~0.0002° ≈ 20 m: saca vértices redundantes sin que se note el cambio de forma.
const tolerancia = iTolerancia >= 0 ? Number(args[iTolerancia + 1]) : 0.0002;

/* ------------------------------------------------------------------ */
/* Lectura                                                             */
/* ------------------------------------------------------------------ */

const buffer = readFileSync(entrada);
const kml = entrada.toLowerCase().endsWith(".kmz") ? extraerKmlDelZip(buffer) : buffer.toString("utf8");

const lineas = extraerLineStrings(kml);
if (lineas.length === 0) {
  console.error(`No se encontró ninguna LineString en ${basename(entrada)}.`);
  process.exit(1);
}

const originales = lineas.reduce((n, l) => n + l.length, 0);
const simplificadas = lineas.map((l) => simplificar(l, tolerancia));
const finales = simplificadas.reduce((n, l) => n + l.length, 0);

const geojson = {
  type: "FeatureCollection",
  features: simplificadas.map((coordinates, i) => ({
    type: "Feature",
    properties: {
      nombre: `Traza Auca Mahuida — Allen${simplificadas.length > 1 ? ` (tramo ${i + 1})` : ""}`,
      origen: basename(entrada),
    },
    geometry: { type: "LineString", coordinates },
  })),
};

mkdirSync(dirname(SALIDA), { recursive: true });
writeFileSync(SALIDA, JSON.stringify(geojson));

console.log(`✓ public/data/traza.geojson`);
console.log(`  ${simplificadas.length} tramo(s) · ${originales} → ${finales} vértices`);

const puntos = extraerPlacemarksPunto(kml);
if (puntos.length > 0) {
  console.log(`\nPlacemark de tipo Point encontrados (${puntos.length}).`);
  console.log("Contrastalos con ESTACIONES en src/data/traza.ts:\n");
  for (const p of puntos) {
    console.log(`  ${p.nombre.padEnd(28)} lng: ${p.lng}  lat: ${p.lat}`);
  }
}

/* ------------------------------------------------------------------ */
/* KMZ = ZIP                                                           */
/* ------------------------------------------------------------------ */

/**
 * Saca el primer .kml del ZIP recorriendo los "local file header" (firma
 * PK\x03\x04). Solo contempla store (0) y deflate (8), que es lo que usan de
 * hecho todos los KMZ.
 */
function extraerKmlDelZip(buf) {
  let offset = 0;

  while (offset < buf.length - 4) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) break;

    const metodo = buf.readUInt16LE(offset + 8);
    const tamComprimido = buf.readUInt32LE(offset + 18);
    const largoNombre = buf.readUInt16LE(offset + 26);
    const largoExtra = buf.readUInt16LE(offset + 28);

    const inicioNombre = offset + 30;
    const nombre = buf.toString("utf8", inicioNombre, inicioNombre + largoNombre);
    const inicioDatos = inicioNombre + largoNombre + largoExtra;
    const datos = buf.subarray(inicioDatos, inicioDatos + tamComprimido);

    if (nombre.toLowerCase().endsWith(".kml")) {
      return (metodo === 8 ? inflateRawSync(datos) : datos).toString("utf8");
    }

    offset = inicioDatos + tamComprimido;
  }

  throw new Error("No se encontró un .kml dentro del KMZ (¿está comprimido de otra forma?)");
}

/* ------------------------------------------------------------------ */
/* KML                                                                 */
/* ------------------------------------------------------------------ */

function parsearCoordenadas(texto) {
  return texto
    .trim()
    .split(/\s+/)
    .map((par) => {
      const [lng, lat] = par.split(",").map(Number);
      return [lng, lat];
    })
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
}

function extraerLineStrings(kml) {
  const lineas = [];
  const re = /<LineString[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/gi;
  let m;
  while ((m = re.exec(kml)) !== null) {
    const coords = parsearCoordenadas(m[1]);
    if (coords.length > 1) lineas.push(coords);
  }
  return lineas;
}

function extraerPlacemarksPunto(kml) {
  const puntos = [];
  const re = /<Placemark[\s\S]*?<\/Placemark>/gi;
  let m;
  while ((m = re.exec(kml)) !== null) {
    const bloque = m[0];
    if (!/<Point[\s>]/i.test(bloque)) continue;

    const nombre = /<name>([\s\S]*?)<\/name>/i.exec(bloque)?.[1] ?? "(sin nombre)";
    const coords = /<Point[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>/i.exec(bloque)?.[1];
    if (!coords) continue;

    const [punto] = parsearCoordenadas(coords);
    if (punto) {
      puntos.push({
        nombre: nombre.replace(/<!\[CDATA\[|\]\]>/g, "").trim(),
        lng: punto[0],
        lat: punto[1],
      });
    }
  }
  return puntos;
}

/* ------------------------------------------------------------------ */
/* Simplificación (Douglas–Peucker)                                    */
/* ------------------------------------------------------------------ */

function distanciaPerpendicular([x, y], [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function simplificar(puntos, epsilon) {
  if (epsilon <= 0 || puntos.length < 3) return puntos;

  let maxDist = 0;
  let indice = 0;
  for (let i = 1; i < puntos.length - 1; i++) {
    const d = distanciaPerpendicular(puntos[i], puntos[0], puntos[puntos.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      indice = i;
    }
  }

  if (maxDist <= epsilon) return [puntos[0], puntos[puntos.length - 1]];

  return [
    ...simplificar(puntos.slice(0, indice + 1), epsilon).slice(0, -1),
    ...simplificar(puntos.slice(indice), epsilon),
  ];
}
