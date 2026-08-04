import "server-only";

import fs from "node:fs";
import path from "node:path";
import { TRAZA_COORDS } from "@/data/traza";

const ARCHIVO_OFICIAL = path.join(process.cwd(), "public", "data", "traza.geojson");

/**
 * Vértices de la traza que va a dibujar el mapa.
 *
 * Si existe `public/data/traza.geojson` —el que genera
 * `scripts/kmz-to-geojson.mjs` a partir del KMZ oficial— manda ese archivo.
 * Si no, se usa la polilínea aproximada de `src/data/traza.ts`. Reemplazar la
 * traza no requiere tocar código: alcanza con dejar el archivo en su lugar.
 */
export function getTrazaCoords(): [number, number][] {
  try {
    if (!fs.existsSync(ARCHIVO_OFICIAL)) return TRAZA_COORDS;
    const geojson = JSON.parse(fs.readFileSync(ARCHIVO_OFICIAL, "utf8"));
    const coords = extraerLinea(geojson);
    return coords.length > 1 ? coords : TRAZA_COORDS;
  } catch (error) {
    console.warn("[traza] No se pudo leer traza.geojson, se usa la aproximada:", error);
    return TRAZA_COORDS;
  }
}

/** ¿La traza dibujada es la oficial o la aproximación de respaldo? */
export function trazaEsOficial(): boolean {
  return fs.existsSync(ARCHIVO_OFICIAL);
}

/**
 * Aplana cualquier GeoJSON razonable a una sola secuencia de vértices.
 * Un KMZ suele traer la traza partida en varios LineString; acá se concatenan
 * en el orden en que vienen.
 */
function extraerLinea(geojson: unknown): [number, number][] {
  const salida: [number, number][] = [];

  const visitar = (geom: { type?: string; coordinates?: unknown } | null | undefined) => {
    if (!geom?.type) return;
    if (geom.type === "LineString") {
      salida.push(...(geom.coordinates as [number, number][]));
    } else if (geom.type === "MultiLineString") {
      for (const linea of geom.coordinates as [number, number][][]) salida.push(...linea);
    } else if (geom.type === "GeometryCollection") {
      const gc = geom as unknown as { geometries: { type: string; coordinates: unknown }[] };
      for (const g of gc.geometries) visitar(g);
    }
  };

  const gj = geojson as {
    type?: string;
    features?: { geometry?: { type: string; coordinates: unknown } }[];
    geometry?: { type: string; coordinates: unknown };
  };

  if (gj.type === "FeatureCollection") {
    for (const f of gj.features ?? []) visitar(f.geometry);
  } else if (gj.type === "Feature") {
    visitar(gj.geometry);
  } else {
    visitar(gj as { type: string; coordinates: unknown });
  }

  // Los KML traen [lng, lat, altura]: nos quedamos con los dos primeros.
  return salida.map(([lng, lat]) => [lng, lat] as [number, number]);
}
