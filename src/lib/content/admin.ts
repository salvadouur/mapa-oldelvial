import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Block, Content, Rail } from "@/lib/types";

/**
 * Acceso a datos del backoffice.
 *
 * A diferencia de `repository.ts` —que solo ve lo publicado y cae al seed— acá
 * se leen borradores y todo se hace con la sesión del usuario: si no hay
 * sesión, RLS devuelve vacío. Nada de service-role en la app.
 */

export class SupabaseNoConfigurado extends Error {
  constructor() {
    super("Supabase no está configurado");
    this.name = "SupabaseNoConfigurado";
  }
}

export async function clienteAdmin() {
  const supabase = await createClient();
  if (!supabase) throw new SupabaseNoConfigurado();
  return supabase;
}

/** Usuario de la sesión actual, o `null`. */
export async function usuarioActual() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * ¿El usuario de la sesión está habilitado para administrar el sitio?
 *
 * Estar autenticado no alcanza: Supabase Auth acepta altas con la clave
 * pública, así que cualquiera podría registrarse. La habilitación es explícita
 * y vive en `backoffice_admins`, que se carga a mano.
 *
 * Esto es solo para la interfaz —mostrar el panel o explicar por qué no—. Quien
 * de verdad corta el paso son las políticas de RLS: aunque alguien se saltee
 * esta comprobación, la base rechaza la escritura.
 */
export async function esAdmin(): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  // RLS solo deja ver la fila propia: si vuelve algo, está habilitado.
  const { data } = await supabase.from("backoffice_admins").select("user_id").maybeSingle();
  return Boolean(data);
}

const SELECT_COMPLETO =
  "id, slug, type, status, title, subtitle, summary, cover_url, vimeo_id, duration_seconds, location_name, kp, lat, lng, tags, order_index, published_at, content_blocks (id, type, position, data)";

/* eslint-disable @typescript-eslint/no-explicit-any */
function aContenido(row: any): Content {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    status: row.status,
    title: row.title,
    subtitle: row.subtitle,
    summary: row.summary,
    coverUrl: row.cover_url,
    vimeoId: row.vimeo_id,
    durationSeconds: row.duration_seconds,
    locationName: row.location_name,
    kp: row.kp,
    lat: row.lat,
    lng: row.lng,
    tags: row.tags ?? [],
    orderIndex: row.order_index ?? 0,
    publishedAt: row.published_at,
    blocks: (row.content_blocks ?? [])
      .slice()
      .sort((a: any, b: any) => a.position - b.position)
      .map(
        (b: any): Block => ({ id: b.id, type: b.type, position: b.position, data: b.data ?? {} }),
      ),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Todos los contenidos, borradores incluidos. */
export async function listarContenidos(): Promise<Content[]> {
  const supabase = await clienteAdmin();
  const { data, error } = await supabase
    .from("contents")
    .select(SELECT_COMPLETO)
    .order("order_index", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(aContenido);
}

export async function obtenerContenido(id: string): Promise<Content | null> {
  const supabase = await clienteAdmin();
  const { data, error } = await supabase
    .from("contents")
    .select(SELECT_COMPLETO)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? aContenido(data) : null;
}

export async function listarFilas(): Promise<Rail[]> {
  const supabase = await clienteAdmin();
  const { data, error } = await supabase
    .from("rails")
    .select(`id, slug, title, order_index, visible, rail_items (position, contents (${SELECT_COMPLETO}))`)
    .order("order_index", { ascending: true });

  if (error) throw new Error(error.message);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    orderIndex: r.order_index ?? 0,
    items: (r.rail_items ?? [])
      .slice()
      .sort((a: any, b: any) => a.position - b.position)
      .map((it: any) => it.contents)
      .filter(Boolean)
      .map(aContenido),
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
