"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { guardarContenido, borrarContenido } from "@/app/admin/actions";
import type { BloqueInput, ContenidoInput } from "@/lib/content/schema";
import { slugify } from "@/lib/format";
import type { Content } from "@/lib/types";
import { Area, Boton, Campo, Seccion, Selector } from "./campos";
import BlockEditor from "./BlockEditor";
import SubirImagen from "./SubirImagen";

// El selector arrastra MapLibre, que necesita `window`.
const SelectorPunto = dynamic(() => import("./SelectorPunto"), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-lg border border-line bg-surface" />,
});

interface Props {
  contenido: Content | null;
}

function aFormulario(c: Content | null): ContenidoInput {
  if (!c) {
    return {
      slug: "",
      type: "especial",
      status: "draft",
      title: "",
      subtitle: "",
      summary: "",
      coverUrl: "",
      vimeoId: "",
      durationSeconds: null,
      locationName: "",
      kp: "",
      lat: null,
      lng: null,
      tags: [],
      orderIndex: 0,
      publishedAt: null,
      blocks: [],
    };
  }

  return {
    id: c.id,
    slug: c.slug,
    type: c.type,
    status: c.status,
    title: c.title,
    subtitle: c.subtitle ?? "",
    summary: c.summary ?? "",
    coverUrl: c.coverUrl ?? "",
    vimeoId: c.vimeoId ?? "",
    durationSeconds: c.durationSeconds,
    locationName: c.locationName ?? "",
    kp: c.kp ?? "",
    lat: c.lat,
    lng: c.lng,
    tags: c.tags,
    orderIndex: c.orderIndex,
    publishedAt: c.publishedAt,
    blocks: c.blocks.map((b) => ({ type: b.type, data: b.data }) as BloqueInput),
  };
}

export default function ContentEditor({ contenido }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ContenidoInput>(() => aFormulario(contenido));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, iniciarGuardado] = useTransition();

  const esNuevo = !contenido;
  const esEspecial = form.type === "especial";

  // El slug se deriva del título mientras no se lo haya tocado a mano, y se
  // congela una vez publicado: cambiarlo rompería enlaces ya compartidos.
  const slugBloqueado = contenido?.status === "published";
  const slugSugerido = useMemo(() => slugify(form.title), [form.title]);

  const set = <K extends keyof ContenidoInput>(campo: K, valor: ContenidoInput[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  function guardar() {
    setAviso(null);
    iniciarGuardado(async () => {
      const payload: ContenidoInput = {
        ...form,
        slug: form.slug || slugSugerido,
        // Un contenido corto no va al mapa: se limpian las coordenadas para que
        // no queden puntos huérfanos si alguien cambió el tipo sobre la marcha.
        lat: esEspecial ? form.lat : null,
        lng: esEspecial ? form.lng : null,
      };

      const r = await guardarContenido(payload);

      if (!r.ok) {
        setErrores(r.errores ?? {});
        setAviso({ tipo: "error", texto: r.mensaje ?? "No se pudo guardar" });
        return;
      }

      setErrores({});
      setAviso({ tipo: "ok", texto: "Guardado" });
      if (esNuevo && r.id) router.replace(`/admin/contenido/${r.id}`);
      else router.refresh();
    });
  }

  function eliminar() {
    if (!contenido) return;
    if (!confirm(`¿Eliminar "${contenido.title}"? No se puede deshacer.`)) return;

    iniciarGuardado(async () => {
      const r = await borrarContenido(contenido.id);
      if (r.ok) router.push("/admin");
      else setAviso({ tipo: "error", texto: r.mensaje ?? "No se pudo eliminar" });
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="label-tech text-ink-faint transition-colors hover:text-cyan">
            ← Contenidos
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {esNuevo ? "Nuevo contenido" : form.title || "Sin título"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!esNuevo && form.status === "published" && (
            <Link
              href={form.type === "simple" ? `/serie/${form.slug}` : `/contenido/${form.slug}`}
              target="_blank"
              className="label-tech rounded-lg border border-line px-3.5 py-2.5 text-ink-soft transition-colors hover:border-cyan/50 hover:text-cyan"
            >
              Ver en el sitio ↗
            </Link>
          )}
          <Boton variante="primario" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar"}
          </Boton>
        </div>
      </header>

      {aviso && (
        <p
          role="status"
          className={`rounded-lg border px-4 py-3 text-[13px] ${
            aviso.tipo === "ok"
              ? "border-mint/40 bg-mint/10 text-mint"
              : "border-amber/40 bg-amber/10 text-amber"
          }`}
        >
          {aviso.texto}
        </p>
      )}

      <Seccion titulo="Identidad" descripcion="Cómo se llama y dónde vive en el sitio.">
        <Campo
          etiqueta="Título"
          value={form.title}
          onChange={(v) => set("title", v)}
          error={errores.title}
          placeholder="Planta de Doble Junta"
        />
        <Campo
          etiqueta="Slug"
          ayuda={
            slugBloqueado
              ? "Ya está publicado: cambiar el slug rompería los enlaces compartidos."
              : `URL del contenido. Si se deja vacío: ${slugSugerido || "…"}`
          }
          error={errores.slug}
          value={form.slug}
          onChange={(v) => set("slug", slugify(v))}
          disabled={slugBloqueado}
          placeholder={slugSugerido}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Selector
            etiqueta="Tipo"
            ayuda={
              esEspecial
                ? "Va georreferenciado en el mapa, con ficha propia. No aparece en el carrusel."
                : "Video de ~1 minuto. Va al carrusel y a la playlist de la serie."
            }
            value={form.type}
            onChange={(v) => set("type", v)}
            opciones={[
              { valor: "especial", texto: "Especial · va en el mapa" },
              { valor: "simple", texto: "Simple · va en la serie" },
            ]}
          />
          <Selector
            etiqueta="Estado"
            ayuda={form.status === "draft" ? "No se ve en el sitio." : "Visible para todos."}
            value={form.status}
            onChange={(v) => set("status", v)}
            opciones={[
              { valor: "draft", texto: "Borrador" },
              { valor: "published", texto: "Publicado" },
            ]}
          />
        </div>
      </Seccion>

      <Seccion titulo="Ficha" descripcion="Lo que se lee en el mapa y en el carrusel.">
        <Campo
          etiqueta="Bajada"
          value={form.subtitle ?? ""}
          onChange={(v) => set("subtitle", v)}
          placeholder="Acopio 1 · el armado del tubo de 24 m"
        />
        <Area
          etiqueta="Resumen"
          ayuda={
            esEspecial
              ? "Dos o tres líneas. Es el texto de la tarjeta flotante del mapa."
              : "Dos o tres líneas. Se lee en la tarjeta del carrusel y en la playlist."
          }
          error={errores.summary}
          rows={3}
          value={form.summary ?? ""}
          onChange={(v) => set("summary", v)}
        />
        <SubirImagen
          etiqueta="Portada"
          ayuda="Si no hay portada, el sitio dibuja un fondo generado."
          value={form.coverUrl ?? ""}
          onChange={(v) => set("coverUrl", v)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Lugar"
            value={form.locationName ?? ""}
            onChange={(v) => set("locationName", v)}
            placeholder="Auca Mahuida"
          />
          <Campo
            etiqueta="Progresiva"
            value={form.kp ?? ""}
            onChange={(v) => set("kp", v)}
            placeholder="KP 000"
          />
        </div>
        <Campo
          etiqueta="Etiquetas"
          ayuda="Separadas por coma."
          value={form.tags.join(", ")}
          onChange={(v) =>
            set(
              "tags",
              v
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            )
          }
        />
        <Campo
          etiqueta="Orden"
          ayuda="Menor primero. Ordena el mapa y la serie."
          type="number"
          value={String(form.orderIndex)}
          onChange={(v) => set("orderIndex", Number(v) || 0)}
        />
      </Seccion>

      <Seccion
        titulo="Video principal"
        descripcion="El que se reproduce en la serie y el que define la duración de la tarjeta."
      >
        <Campo
          etiqueta="ID de Vimeo"
          ayuda="123456789 · o 123456789/hash si el video es no listado"
          value={form.vimeoId ?? ""}
          onChange={(v) => set("vimeoId", v)}
        />
        <Campo
          etiqueta="Duración en segundos"
          type="number"
          value={form.durationSeconds === null ? "" : String(form.durationSeconds)}
          onChange={(v) => set("durationSeconds", v === "" ? null : Number(v) || 0)}
          placeholder="222"
        />
      </Seccion>

      {esEspecial && (
        <Seccion
          titulo="Georreferencia"
          descripcion="Dónde late el radar sobre la traza. Puede ser cualquier punto, no solo una estación."
        >
          <SelectorPunto
            lat={form.lat ?? null}
            lng={form.lng ?? null}
            error={errores.lat}
            onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
          />
        </Seccion>
      )}

      <Seccion
        titulo="Bloques"
        descripcion="El cuerpo de la publicación, en el orden en que se lee."
      >
        <BlockEditor bloques={form.blocks} onChange={(blocks) => set("blocks", blocks)} />
      </Seccion>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 pb-10">
        {!esNuevo ? (
          <Boton variante="peligro" onClick={eliminar} disabled={guardando}>
            Eliminar contenido
          </Boton>
        ) : (
          <span />
        )}
        <Boton variante="primario" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </Boton>
      </div>
    </div>
  );
}
