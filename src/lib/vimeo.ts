/**
 * Helpers de Vimeo.
 *
 * El campo `vimeoId` admite dos formas:
 *   "123456789"        → video público
 *   "123456789/a1b2c3" → video no listado, con hash de privacidad
 *
 * La segunda es la que conviene para material de obra que no debe aparecer en
 * búsquedas de Vimeo pero sí tiene que verse embebido en el sitio.
 */

export interface OpcionesEmbed {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  /** Oculta título, autor y demás chrome del reproductor. */
  limpio?: boolean;
  /** Color de los controles, sin el `#`. */
  color?: string;
}

/**
 * Acepta lo que el editor pegue en el campo de video: "123456789",
 * "123456789/hash" o cualquier link de Vimeo — la página del video
 * (vimeo.com/123/hash?lo=que&sea), el reproductor
 * (player.vimeo.com/video/123?h=hash) o el gestor (vimeo.com/manage/videos/123).
 * De todos extrae ID y hash. Cualquier otra cosa pasa tal cual.
 *
 * El hash importa: en un video no listado, sin hash Vimeo devuelve 404.
 */
export function normalizarVimeoId(entrada: string): string {
  const texto = entrada.trim();
  const m = texto.match(/vimeo\.com\/(?:video\/|manage\/videos\/)?(\d+)(?:\/([a-z0-9]+))?/i);
  if (!m) return texto;
  // El reproductor lleva el hash como query (?h=...) en vez de en la ruta.
  const h = m[2] ?? texto.match(/[?&]h=([a-z0-9]+)/i)?.[1];
  return h ? `${m[1]}/${h}` : m[1];
}

export function partirVimeoId(vimeoId: string): { id: string; hash?: string } {
  const [id, hash] = vimeoId.trim().split("/");
  return { id, hash: hash || undefined };
}

export function vimeoEmbedUrl(vimeoId: string, opciones: OpcionesEmbed = {}): string {
  const { id, hash } = partirVimeoId(vimeoId);
  const { autoplay, loop, muted, limpio = true, color = "4ecdf5" } = opciones;

  const p = new URLSearchParams({
    color,
    dnt: "1", // sin cookies de seguimiento de Vimeo
    playsinline: "1",
  });

  if (hash) p.set("h", hash);
  if (autoplay) p.set("autoplay", "1");
  if (loop) p.set("loop", "1");
  if (muted) p.set("muted", "1");
  if (limpio) {
    p.set("title", "0");
    p.set("byline", "0");
    p.set("portrait", "0");
  }

  return `https://player.vimeo.com/video/${id}?${p.toString()}`;
}

/** URL pública del video, para enlaces "ver en Vimeo". */
export function vimeoUrl(vimeoId: string): string {
  const { id, hash } = partirVimeoId(vimeoId);
  return `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`;
}
