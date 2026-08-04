/**
 * Copia el worker de MapLibre a `public/maplibre/`.
 *
 * Por qué hace falta: maplibre-gl 6 arma la URL de su worker a partir de
 * `import.meta.url` del bundle principal, reemplazando el nombre del archivo.
 * Con Turbopack ese bundle vive en `/_next/static/chunks/…`, donde el worker
 * nunca se emite, así que la URL derivada da 404. El worker muere en silencio
 * —sin evento de error— y el síntoma es desconcertante: las capas raster se
 * ven, pero las fuentes GeoJSON quedan cargando para siempre.
 *
 * La solución es servir el worker desde `public/` y apuntarlo con
 * `setWorkerUrl()` (ver src/components/map/TrazaMap.tsx). El worker importa
 * `./maplibre-gl-shared.mjs` de forma relativa, por eso se copian los dos
 * juntos al mismo directorio.
 *
 * Corre en `postinstall` para no desincronizarse al actualizar la librería.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const origen = join(raiz, "node_modules", "maplibre-gl", "dist");
const destino = join(raiz, "public", "maplibre");

const ARCHIVOS = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

await mkdir(destino, { recursive: true });

for (const archivo of ARCHIVOS) {
  await copyFile(join(origen, archivo), join(destino, archivo));
}

console.log(`[maplibre] Worker copiado a public/maplibre/ (${ARCHIVOS.join(", ")})`);
