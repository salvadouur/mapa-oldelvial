/**
 * Geometría de la traza y estaciones de bombeo.
 *
 * ⚠ Las coordenadas son APROXIMADAS: siguen el corredor real Auca Mahuida →
 * Allen pero no provienen del trazado oficial. Cuando esté el KMZ, correr
 *
 *     node scripts/kmz-to-geojson.mjs <archivo.kmz>
 *
 * que reescribe `public/data/traza.geojson`. Si ese archivo existe, el mapa lo
 * usa y estas constantes quedan solo como respaldo. Ver README → "Traza".
 */

export interface Estacion {
  /** Slug estable: se usa para anclar contenidos a la estación. */
  id: string;
  nombre: string;
  /** Rótulo secundario bajo el nombre en el mapa. */
  detalle: string;
  lng: number;
  lat: number;
}

/**
 * Las 7 estaciones de bombeo, en orden de recorrido (norte → sur).
 * Coordenadas REALES, tomadas de los Placemark del KMZ oficial del trazado
 * ("DUPLICAR NORTE.kmz": EB AUCA MAHUIDA, Tee CERRO BAYO, TRs CRUCERO
 * CATRIEL, TRs EB ME, Tee Aporte La Escondida, TRs EB LAGO PELEGRINI,
 * Trs EB-Allen).
 */
export const ESTACIONES: Estacion[] = [
  { id: "auca-mahuida", nombre: "EB Auca Mahuida", detalle: "Neuquén · cabecera", lng: -68.82327, lat: -37.48502 },
  { id: "cerro-bayo", nombre: "EB Cerro Bayo", detalle: "Neuquén", lng: -68.66892, lat: -37.56721 },
  { id: "crucero-catriel", nombre: "EB Crucero Catriel", detalle: "Río Negro", lng: -68.425, lat: -37.72396 },
  { id: "medanito", nombre: "EB Medanito", detalle: "Río Negro", lng: -67.95405, lat: -37.99443 },
  { id: "la-escondida", nombre: "EB La Escondida", detalle: "Río Negro", lng: -67.96953, lat: -38.21055 },
  { id: "lago-pellegrini", nombre: "EB Lago Pellegrini", detalle: "Río Negro", lng: -67.81028, lat: -38.60217 },
  { id: "allen", nombre: "EB Allen", detalle: "Río Negro · fin de traza", lng: -67.66946, lat: -38.93558 },
];

/**
 * Polilínea de RESPALDO: une las estaciones reales con algún vértice
 * intermedio. Solo se dibuja si falta `public/data/traza.geojson` (el trazado
 * oficial que genera `npm run traza`); también alimenta la progresiva
 * aproximada.
 */
export const TRAZA_COORDS: [number, number][] = [
  [-68.82327, -37.48502], // EB Auca Mahuida
  [-68.71, -37.535],
  [-68.66892, -37.56721], // EB Cerro Bayo
  [-68.52, -37.67],
  [-68.425, -37.72396], // EB Crucero Catriel
  [-68.19, -37.85],
  [-67.95405, -37.99443], // EB Medanito
  [-67.925, -38.1],
  [-67.96953, -38.21055], // EB La Escondida
  [-67.94, -38.35],
  [-67.87, -38.47],
  [-67.81028, -38.60217], // EB Lago Pellegrini
  [-67.79, -38.72],
  [-67.72, -38.85],
  [-67.66946, -38.93558], // EB Allen
];

/**
 * Tope de desplazamiento del mapa: no se puede salir de Argentina.
 * [oeste, sur, este, norte]
 */
export const ARGENTINA_BOUNDS: [number, number, number, number] = [-76.5, -56.5, -52.0, -20.5];

/** Encuadre inicial, ajustado a la traza con aire alrededor. */
export const TRAZA_BOUNDS: [[number, number], [number, number]] = [
  [-69.6, -39.5],
  [-67.1, -37.2],
];

// Alcanza para encuadrar la Argentina entera de una punta a la otra.
export const ZOOM_MIN = 3.1;
export const ZOOM_MAX = 14;

/* ------------------------------------------------------------------ */
/* Utilidades geométricas                                              */
/* ------------------------------------------------------------------ */

const RADIO_TIERRA_KM = 6371;

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

/** Longitud total de una polilínea, en km. */
export function longitudKm(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversineKm(coords[i - 1], coords[i]);
  return total;
}

/**
 * Progresiva (KP) de un punto: distancia sobre la traza desde la cabecera hasta
 * el vértice más cercano al punto. Es una aproximación suficiente para rotular.
 */
export function progresivaKm(punto: [number, number], coords = TRAZA_COORDS): number {
  let mejorIdx = 0;
  let mejorDist = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = haversineKm(punto, coords[i]);
    if (d < mejorDist) {
      mejorDist = d;
      mejorIdx = i;
    }
  }
  return longitudKm(coords.slice(0, mejorIdx + 1));
}

/** Progresiva lista para mostrar, del estilo "KP 247". */
export function formatearProgresiva(punto: [number, number], coords = TRAZA_COORDS): string {
  const km = progresivaKm(punto, coords);
  return `KP ${Math.round(km).toString().padStart(3, "0")}`;
}

/** GeoJSON de respaldo, por si no hay `public/data/traza.geojson`. */
export function trazaGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { nombre: "Traza Auca Mahuida — Allen", aproximada: true },
        geometry: { type: "LineString", coordinates: TRAZA_COORDS },
      },
    ],
  };
}
