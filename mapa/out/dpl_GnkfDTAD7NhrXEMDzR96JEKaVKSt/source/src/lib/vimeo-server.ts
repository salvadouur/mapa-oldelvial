import "server-only";

import type { Content } from "@/lib/types";
import { partirVimeoId } from "./vimeo";

/**
 * Metadatos de Vimeo resueltos en el servidor.
 *
 * Se usa oEmbed, que funciona también con videos no listados siempre que se
 * pase el hash de privacidad, y no necesita token ni credenciales.
 *
 * Con esto, un contenido no necesita portada cargada a mano: si tiene `vimeoId`
 * y no tiene `coverUrl`, la miniatura sale del propio video. Lo mismo con la
 * duración. Cualquier valor cargado desde el backoffice tiene prioridad — esto
 * solo completa lo que falta.
 */

export interface VimeoMeta {
  title: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

/** Un día: las miniaturas de Vimeo cambian solo si se reemplaza el video. */
const REVALIDAR_SEGUNDOS = 60 * 60 * 24;

/** Ancho pedido a Vimeo. Alcanza para el hero a pantalla completa. */
const ANCHO_MINIATURA = 1280;

export async function getVimeoMeta(vimeoId: string): Promise<VimeoMeta | null> {
  const { id, hash } = partirVimeoId(vimeoId);
  if (!id) return null;

  const videoUrl = `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`;
  const oembed = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}&width=${ANCHO_MINIATURA}`;

  try {
    const res = await fetch(oembed, { next: { revalidate: REVALIDAR_SEGUNDOS } });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
      duration?: number;
    };

    return {
      title: json.title ?? null,
      thumbnailUrl: json.thumbnail_url ?? null,
      durationSeconds: typeof json.duration === "number" ? json.duration : null,
    };
  } catch {
    // Sin red, o Vimeo caído: el sitio sigue funcionando con el fondo generado.
    return null;
  }
}

/**
 * Completa portadas y duraciones faltantes de una lista de contenidos, y los
 * pósters de sus bloques de video.
 *
 * Resuelve cada ID una sola vez aunque se repita entre contenidos, y todos en
 * paralelo: en la home son ~10 pedidos la primera vez y ninguno después,
 * gracias al caché de `fetch` de Next.
 */
export async function completarDesdeVimeo(contenidos: Content[]): Promise<Content[]> {
  const pendientes = new Set<string>();

  for (const c of contenidos) {
    if (c.vimeoId && (!c.coverUrl || c.durationSeconds === null)) pendientes.add(c.vimeoId);
    for (const b of c.blocks) {
      if (b.type === "video" && b.data.vimeoId && !b.data.posterUrl) {
        pendientes.add(b.data.vimeoId);
      }
    }
  }

  if (pendientes.size === 0) return contenidos;

  const ids = [...pendientes];
  const resueltos = await Promise.all(ids.map(getVimeoMeta));
  const meta = new Map(ids.map((id, i) => [id, resueltos[i]]));

  return contenidos.map((c) => {
    const propio = c.vimeoId ? meta.get(c.vimeoId) : null;

    return {
      ...c,
      coverUrl: c.coverUrl ?? propio?.thumbnailUrl ?? null,
      durationSeconds: c.durationSeconds ?? propio?.durationSeconds ?? null,
      blocks: c.blocks.map((b) => {
        if (b.type !== "video" || b.data.posterUrl) return b;
        const delBloque = meta.get(b.data.vimeoId);
        if (!delBloque?.thumbnailUrl) return b;
        return { ...b, data: { ...b.data, posterUrl: delBloque.thumbnailUrl } };
      }),
    };
  });
}
