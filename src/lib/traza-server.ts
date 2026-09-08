import "server-only";

import fs from "node:fs";
import path from "node:path";
import { TRAZA_COORDS } from "@/data/traza";

const ARCHIVO_OFICIAL = path.join(process.cwd(), "public", "data", "traza.geojson");

export interface TrazaDibujable {
  /**
   * Tramos de la traza, cada uno una secuencia de vértices [lng, lat].
   * El KMZ oficial viene partido en segmentos: dibujarlos por separado evita
   * inventar conexiones rectas entre el final de uno y el inicio del otro.
   */
  lineas: [number, number][][];
  /** Todos los vértices juntos, para calcular encuadres. */
  todas: [number, number][];
}

/**
 * La traza que dibuja el mapa.
 *
 * Si existe `public/data/traza.geojson` —generado por `npm run traza` a partir
 * del KMZ oficial— manda ese archivo. Si no, se usa la polilínea aproximada de
 * `src/data/traza.ts`. Reemplazar la traza no requiere tocar código.
 */
export function getTraza(): TrazaDibujable {
  try {
    if (!fs.existsSync(ARCHIVO_OFICIAL)) return respaldo();
    const geojson = JSON.parse(fs.readFileSync(ARCHIVO_OFICIAL, "utf8"));
    const lineas = extraerLineas(geojson);
    if (lineas.length === 0) return respaldo();
    return { lineas, todas: lineas.flat() };
  } catch (error) {
    console.warn("[traza] No se pudo leer traza.geojson, se usa la aproximada:", error);
    return respaldo();
  }
}

function respaldo(): TrazaDibujable {
  return { lineas: [TRAZA_COORDS], todas: TRAZA_COORDS };
}

/** Junta todas las LineString/MultiLineString del GeoJSON, tramo por tramo. */
function extraerLineas(geojson: unknown): [number, number][][] {
  const salida: [number, number][][] = [];

  const visitar = (geom: { type?: string; coordinates?: unknown } | null | undefined) => {
    if (!geom?.type) return;
    if (geom.type === "LineString") {
      salida.push(limpiar(geom.coordinates as number[][]));
    } else if (geom.type === "MultiLineString") {
      for (const linea of geom.coordinates as number[][][]) salida.push(limpiar(linea));
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

  return salida.filter((l) => l.length > 1);
}

/** Los KML traen [lng, lat, altura]: nos quedamos con los dos primeros. */
function limpiar(coords: number[][]): [number, number][] {
  return coords.map(([lng, lat]) => [lng, lat] as [number, number]);
}
