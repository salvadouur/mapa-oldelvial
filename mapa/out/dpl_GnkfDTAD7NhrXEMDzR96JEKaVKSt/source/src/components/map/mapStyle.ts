import type { StyleSpecification } from "maplibre-gl";

/**
 * Estilo del mapa, armado a mano sobre teselas raster de Esri (sin API key).
 *
 * Dos capas base intercambiables y, encima de ambas, un velo azul que es lo que
 * da la identidad cromática del sitio: el satélite se lee como una carta náutica
 * y no como una foto.
 *
 * Si en algún momento hace falta más definición o teselas vectoriales, el
 * reemplazo natural es MapTiler o Mapbox con token. Solo cambia este archivo.
 */

export type Basemap = "satelite" | "oscuro";

const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const ESRI_DARK =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";

const ESRI_DARK_LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

const ATRIB_IMAGERY = "Imágenes: Esri, Maxar, Earthstar Geographics";
const ATRIB_CANVAS = "Esri · HERE · Garmin · OpenStreetMap";

/**
 * Atribución por capa base. La muestra el panel de referencias del mapa: el
 * control propio de MapLibre se apoya abajo, donde el cajón de contenidos lo
 * taparía, y estas licencias exigen que el crédito se vea.
 */
export const ATRIBUCION: Record<Basemap, string> = {
  satelite: ATRIB_IMAGERY,
  oscuro: ATRIB_CANVAS,
};

/**
 * Velo azul por capa base: es lo que le da identidad cromática al mapa.
 *
 * Sobre el satélite se mantiene liviano a propósito, para que la imagen real
 * —el terreno, la pista abierta, los ríos— se siga leyendo por debajo del tinte.
 */
export const VELO: Record<Basemap, { color: string; opacidad: number }> = {
  satelite: { color: "#0a2b4d", opacidad: 0.24 },
  oscuro: { color: "#06182e", opacidad: 0.42 },
};

export function buildStyle(basemap: Basemap): StyleSpecification {
  const satelite = basemap === "satelite";

  return {
    version: 8,
    // Sin `glyphs` a propósito: no hay symbol layers en este estilo —los
    // rótulos son marcadores HTML—, así que no hace falta servidor de glifos.
    sources: {
      satelite: {
        type: "raster",
        tiles: [ESRI_IMAGERY],
        tileSize: 256,
        maxzoom: 18,
        attribution: ATRIB_IMAGERY,
      },
      oscuro: {
        type: "raster",
        tiles: [ESRI_DARK],
        tileSize: 256,
        maxzoom: 16,
        attribution: ATRIB_CANVAS,
      },
      etiquetas: {
        type: "raster",
        tiles: [ESRI_DARK_LABELS],
        tileSize: 256,
        maxzoom: 16,
      },
    },
    layers: [
      {
        id: "fondo",
        type: "background",
        paint: { "background-color": "#03060d" },
      },
      {
        id: "base-oscuro",
        type: "raster",
        source: "oscuro",
        layout: { visibility: satelite ? "none" : "visible" },
        paint: {
          "raster-opacity": 0.95,
          "raster-saturation": -0.1,
          "raster-contrast": 0.1,
          "raster-brightness-max": 0.72,
        },
      },
      {
        id: "base-satelite",
        type: "raster",
        source: "satelite",
        layout: { visibility: satelite ? "visible" : "none" },
        paint: {
          "raster-opacity": 0.96,
          "raster-saturation": -0.18,
          "raster-hue-rotate": 175,
          "raster-contrast": 0.06,
          "raster-brightness-max": 0.95,
        },
      },
      {
        // Velo azul: unifica ambas bases y baja el contraste del terreno para
        // que la traza y los puntos queden siempre por encima visualmente.
        id: "velo-azul",
        type: "background",
        paint: {
          "background-color": VELO[basemap].color,
          "background-opacity": VELO[basemap].opacidad,
        },
      },
      {
        id: "etiquetas-lugares",
        type: "raster",
        source: "etiquetas",
        layout: { visibility: satelite ? "none" : "visible" },
        paint: { "raster-opacity": 0.55 },
      },
    ],
  } as StyleSpecification;
}
