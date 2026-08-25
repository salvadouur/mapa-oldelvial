import type { StyleSpecification } from "maplibre-gl";

/**
 * Estilo del mapa, armado a mano sobre teselas raster de Esri (sin API key).
 *
 * Una sola fuente de imagen y dos lecturas de ella, que se alternan sin
 * reconstruir el estilo: cambian la corrección de color del raster y la
 * visibilidad del velo.
 *
 * Si en algún momento hace falta más definición o teselas vectoriales, el
 * reemplazo natural es MapTiler o Mapbox con token. Solo cambia este archivo.
 */

/**
 * Dos lecturas del mismo terreno:
 *
 * - `satelite`: la imagen tal cual, sin velo ni retícula. Es la que se ve al
 *   entrar, porque es la que muestra la obra de verdad.
 * - `tactico`: la misma imagen bajo un velo azul y con retícula encima, con
 *   aire de pantalla de instrumento.
 */
export type Basemap = "satelite" | "tactico";

const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const ATRIB_IMAGERY = "Imágenes: Esri, Maxar, Earthstar Geographics";

/**
 * Atribución de las teselas. La muestra el panel de referencias del mapa: el
 * control propio de MapLibre se apoya abajo, donde el cajón de contenidos lo
 * taparía, y la licencia exige que el crédito se vea.
 */
export const ATRIBUCION: Record<Basemap, string> = {
  satelite: ATRIB_IMAGERY,
  tactico: ATRIB_IMAGERY,
};

export const NOMBRE_CAPA: Record<Basemap, string> = {
  satelite: "Satélite",
  tactico: "Táctico",
};

/** Velo azul: solo en modo táctico. En satélite la imagen va limpia. */
export const VELO: Record<Basemap, { color: string; opacidad: number }> = {
  satelite: { color: "#0a2b4d", opacidad: 0 },
  tactico: { color: "#0a2b4d", opacidad: 0.42 },
};

/**
 * Corrección de color del raster.
 *
 * En satélite se toca lo mínimo —apenas un recorte de brillo para que los
 * blancos no compitan con la traza—. En táctico se desatura y se rota el matiz
 * hacia el azul, que es lo que da el aspecto de carta náutica.
 */
export const RASTER: Record<
  Basemap,
  {
    "raster-saturation": number;
    "raster-hue-rotate": number;
    "raster-contrast": number;
    "raster-brightness-max": number;
  }
> = {
  satelite: {
    "raster-saturation": -0.04,
    "raster-hue-rotate": 0,
    "raster-contrast": 0.02,
    "raster-brightness-max": 0.98,
  },
  tactico: {
    "raster-saturation": -0.18,
    "raster-hue-rotate": 175,
    "raster-contrast": 0.06,
    "raster-brightness-max": 0.95,
  },
};

export function buildStyle(basemap: Basemap): StyleSpecification {
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
    },
    layers: [
      {
        id: "fondo",
        type: "background",
        paint: { "background-color": "#03060d" },
      },
      {
        id: "base-satelite",
        type: "raster",
        source: "satelite",
        paint: { "raster-opacity": 1, ...RASTER[basemap] },
      },
      {
        // Velo azul: baja el contraste del terreno para que la traza y los
        // puntos queden siempre por encima visualmente.
        id: "velo-azul",
        type: "background",
        paint: {
          "background-color": VELO[basemap].color,
          "background-opacity": VELO[basemap].opacidad,
        },
      },
    ],
  } as StyleSpecification;
}
