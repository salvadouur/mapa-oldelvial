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
