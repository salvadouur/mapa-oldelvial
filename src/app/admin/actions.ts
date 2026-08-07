"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteAdmin, esAdmin, usuarioActual } from "@/lib/content/admin";
import { contenidoSchema, type ContenidoInput } from "@/lib/content/schema";

export interface Resultado {
  ok: boolean;
  mensaje?: string;
  /** Errores por campo, para pintarlos junto al input. */
  errores?: Record<string, string>;
  id?: string;
}

/**
 * Toda Server Action verifica sesión y habilitación por su cuenta.
 *
 * No alcanza con el guard del proxy: las actions se pueden invocar con un POST
 * directo, sin pasar por la navegación que el proxy filtra. Y no alcanza con
 * estar autenticado: Supabase acepta altas con la clave pública, así que la
 * habilitación tiene que ser explícita.
 */
async function exigirAdmin() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/admin/login");
  if (!(await esAdmin())) {
    throw new Error("Este usuario no está habilitado para administrar el sitio.");
  }
  return usuario;
}

/** Refresca todo lo que puede haber cambiado al tocar un contenido. */
function revalidarSitio(slug?: string) {
  revalidatePath("/");
  revalidatePath("/serie");
  revalidatePath("/admin");
  if (slug) {
    revalidatePath(`/contenido/${slug}`);
    revalidatePath(`/serie/${slug}`);
  }
}

/* ------------------------------------------------------------------ */
/* Contenidos                                                          */
/* ------------------------------------------------------------------ */

export async function guardarContenido(input: ContenidoInput): Promise<Resultado> {
  await exigirAdmin();

  const parsed = contenidoSchema.safeParse(input);
  if (!parsed.success) {
    const errores: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const campo = issue.path.join(".") || "_";
      errores[campo] ??= issue.message;
    }
    return { ok: false, mensaje: "Revisá los campos marcados", errores };
  }

  const c = parsed.data;
  const supabase = await clienteAdmin();

  const fila = {
    slug: c.slug,
    type: c.type,
    status: c.status,
    title: c.title,
    subtitle: c.subtitle || null,
    summary: c.summary || null,
    cover_url: c.coverUrl || null,
    vimeo_id: c.vimeoId || null,
    duration_seconds: c.durationSeconds ?? null,
    location_name: c.locationName || null,
    kp: c.kp || null,
    lat: c.lat ?? null,
    lng: c.lng ?? null,
    tags: c.tags,
    order_index: c.orderIndex,
    // Se estampa la fecha en la primera publicación y no se vuelve a tocar:
    // republicar no debería mover el contenido al tope de "últimas".
    published_at:
      c.status === "published" ? (c.publishedAt ?? new Date().toISOString()) : c.publishedAt || null,
  };

  const { data, error } = c.id
    ? await supabase.from("contents").update(fila).eq("id", c.id).select("id").single()
    : await supabase.from("contents").insert(fila).select("id").single();

  if (error) {
    const duplicado = error.code === "23505";
    return {
      ok: false,
      mensaje: duplicado ? `Ya existe un contenido con el slug "${c.slug}"` : error.message,
      errores: duplicado ? { slug: "Este slug ya está en uso" } : undefined,
    };
  }

  const contenidoId = data.id as string;

  // Los bloques se reemplazan enteros: es más simple y más predecible que
  // reconciliar altas, bajas y reordenamientos uno por uno.
  const { error: errorBorrado } = await supabase
    .from("content_blocks")
    .delete()
    .eq("content_id", contenidoId);
  if (errorBorrado) return { ok: false, mensaje: errorBorrado.message };

  if (c.blocks.length > 0) {
    const { error: errorBloques } = await supabase.from("content_blocks").insert(
      c.blocks.map((b, i) => ({
        content_id: contenidoId,
        type: b.type,
        position: i,
        data: b.data,
      })),
    );
    if (errorBloques) return { ok: false, mensaje: errorBloques.message };
  }

  revalidarSitio(c.slug);
  return { ok: true, id: contenidoId, mensaje: "Guardado" };
}

export async function cambiarEstado(
  id: string,
  status: "draft" | "published",
): Promise<Resultado> {
  await exigirAdmin();
  const supabase = await clienteAdmin();

  const { data: actual } = await supabase
    .from("contents")
    .select("slug, published_at")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("contents")
    .update({
      status,
      published_at:
        status === "published" ? (actual?.published_at ?? new Date().toISOString()) : actual?.published_at,
    })
    .eq("id", id);

  if (error) return { ok: false, mensaje: error.message };

  revalidarSitio(actual?.slug);
  return { ok: true, mensaje: status === "published" ? "Publicado" : "Pasado a borrador" };
}

export async function borrarContenido(id: string): Promise<Resultado> {
  await exigirAdmin();
  const supabase = await clienteAdmin();

  const { data: actual } = await supabase.from("contents").select("slug").eq("id", id).single();
  const { error } = await supabase.from("contents").delete().eq("id", id);
  if (error) return { ok: false, mensaje: error.message };

  revalidarSitio(actual?.slug);
  return { ok: true, mensaje: "Contenido eliminado" };
}

/* ------------------------------------------------------------------ */
/* Filas del carrusel                                                  */
/* ------------------------------------------------------------------ */

export async function guardarFila(fila: {
  id?: string;
  slug: string;
  title: string;
  orderIndex: number;
  visible: boolean;
}): Promise<Resultado> {
  await exigirAdmin();
  const supabase = await clienteAdmin();

  const payload = {
    slug: fila.slug,
    title: fila.title,
    order_index: fila.orderIndex,
    visible: fila.visible,
  };

  const { error } = fila.id
    ? await supabase.from("rails").update(payload).eq("id", fila.id)
    : await supabase.from("rails").insert(payload);

  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/");
  revalidatePath("/admin/carrusel");
  return { ok: true, mensaje: "Fila guardada" };
}

export async function borrarFila(id: string): Promise<Resultado> {
  await exigirAdmin();
  const supabase = await clienteAdmin();
  const { error } = await supabase.from("rails").delete().eq("id", id);
  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/");
  revalidatePath("/admin/carrusel");
  return { ok: true, mensaje: "Fila eliminada" };
}

/** Reemplaza los ítems de una fila, en el orden recibido. */
export async function guardarItemsDeFila(
  railId: string,
  contentIds: string[],
): Promise<Resultado> {
  await exigirAdmin();
  const supabase = await clienteAdmin();

  const { error: errorBorrado } = await supabase
    .from("rail_items")
    .delete()
    .eq("rail_id", railId);
  if (errorBorrado) return { ok: false, mensaje: errorBorrado.message };

  if (contentIds.length > 0) {
    const { error } = await supabase.from("rail_items").insert(
      contentIds.map((content_id, position) => ({ rail_id: railId, content_id, position })),
    );
    if (error) return { ok: false, mensaje: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/carrusel");
  return { ok: true, mensaje: "Fila actualizada" };
}

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */

export async function cerrarSesion() {
  const supabase = await clienteAdmin();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
