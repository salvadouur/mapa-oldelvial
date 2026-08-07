/** Formateo compartido. Todo en es-AR, con hora fija en UTC para que el
 *  servidor y el cliente rindan exactamente el mismo texto (si no, React
 *  se queja de hydration mismatch). */

export function formatDuracion(segundos: number | null | undefined): string {
  if (!segundos || segundos <= 0) return "—";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const fechaCorta = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return fechaCorta.format(d).replace(".", "");
}

export function formatKm(km: number): string {
  return `KP ${Math.round(km).toString().padStart(3, "0")}`;
}

/** Slug con acentos plegados, para generar URLs desde el backoffice. */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/**
 * Gradiente determinístico a partir del slug. Se usa como portada cuando un
 * contenido todavía no tiene imagen cargada: es preferible a un rectángulo
 * vacío o a una imagen rota.
 */
export function gradienteDeSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  const h = Math.abs(hash) % 60; // franja azul–cyan
  return `linear-gradient(140deg, hsl(${200 + h * 0.3} 55% 16%), hsl(${196 + h * 0.5} 70% 9%))`;
}
