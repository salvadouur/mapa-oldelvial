/**
 * Modelo de contenido del sitio.
 *
 * Hay dos familias de contenido, y toda la app se organiza alrededor de esa
 * distinción:
 *
 * - **Especiales** (`especial`): georreferenciados sobre la traza. En el mapa
 *   se marcan con un radar y abren ficha propia (`/contenido/[slug]`), armada
 *   con bloques: video, texto, galería, modelo 3D de Sketchfab, infografía,
 *   cifras, pasos. No aparecen en el carrusel.
 * - **Simples** (`simple`): videos de ~1 minuto. No van al mapa. Viven en el
 *   carrusel de la home y en `/serie`, que es una playlist de scroll infinito
 *   con contenidos sugeridos.
 */

export type ContentType = "especial" | "simple";
export type ContentStatus = "draft" | "published";

export interface Content {
  id: string;
  slug: string;
  type: ContentType;
  status: ContentStatus;
  title: string;
  subtitle: string | null;
  /** Resumen corto: es lo que se lee en el hover del mapa y en la tarjeta. */
  summary: string | null;
  coverUrl: string | null;
  /** ID numérico de Vimeo. Para videos privados: "123456789/h4sh". */
  vimeoId: string | null;
  durationSeconds: number | null;
  /** Nombre del lugar (ej. "Auca Mahuida"). */
  locationName: string | null;
  /** Progresiva sobre la traza, como texto libre (ej. "KP 247"). */
  kp: string | null;
  /** Solo en los especiales: ancla del punto sobre el mapa. */
  lat: number | null;
  lng: number | null;
  tags: string[];
  orderIndex: number;
  publishedAt: string | null;
  blocks: Block[];
}

/** Contenido con coordenadas garantizadas: lo que el mapa puede dibujar. */
export type MappedContent = Content & { lat: number; lng: number };

export function isMapped(content: Content): content is MappedContent {
  return typeof content.lat === "number" && typeof content.lng === "number";
}

/* ------------------------------------------------------------------ */
/* Bloques de una publicación                                          */
/* ------------------------------------------------------------------ */

export type BlockType =
  | "text"
  | "video"
  | "gallery"
  | "sketchfab"
  | "infographic"
  | "stats"
  | "steps";

export interface BaseBlock {
  id: string;
  position: number;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  data: {
    heading?: string;
    /** Párrafos en texto plano. `**negrita**` se resalta al renderizar. */
    body: string;
  };
}

export interface VideoBlock extends BaseBlock {
  type: "video";
  data: {
    vimeoId: string;
    posterUrl?: string;
    caption?: string;
  };
}

export interface GalleryBlock extends BaseBlock {
  type: "gallery";
  data: {
    caption?: string;
    images: { url: string; alt?: string }[];
  };
}

export interface SketchfabBlock extends BaseBlock {
  type: "sketchfab";
  data: {
    /** ID del modelo, el hash que aparece en la URL de Sketchfab. */
    modelId: string;
    title?: string;
    caption?: string;
  };
}

export interface InfographicBlock extends BaseBlock {
  type: "infographic";
  data: {
    url: string;
    alt?: string;
    caption?: string;
  };
}

export interface StatsBlock extends BaseBlock {
  type: "stats";
  data: {
    items: { label: string; value: string; unit?: string }[];
  };
}

export interface StepsBlock extends BaseBlock {
  type: "steps";
  data: {
    heading?: string;
    items: { title: string; body: string }[];
  };
}

export type Block =
  | TextBlock
  | VideoBlock
  | GalleryBlock
  | SketchfabBlock
  | InfographicBlock
  | StatsBlock
  | StepsBlock;

/* ------------------------------------------------------------------ */
/* Filas del carrusel                                                  */
/* ------------------------------------------------------------------ */

/** Una fila horizontal del carrusel, al estilo de las filas de Netflix. */
export interface Rail {
  id: string;
  slug: string;
  title: string;
  orderIndex: number;
  items: Content[];
}
