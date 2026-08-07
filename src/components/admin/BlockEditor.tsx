"use client";

import { useState } from "react";
import type { BloqueInput } from "@/lib/content/schema";
import { Area, Boton, Campo } from "./campos";
import SubirImagen from "./SubirImagen";

interface Props {
  bloques: BloqueInput[];
  onChange: (bloques: BloqueInput[]) => void;
}

const TIPOS: { tipo: BloqueInput["type"]; nombre: string; descripcion: string }[] = [
  { tipo: "video", nombre: "Video", descripcion: "Reproductor de Vimeo con póster" },
  { tipo: "text", nombre: "Texto", descripcion: "Título y párrafos" },
  { tipo: "stats", nombre: "Cifras", descripcion: "Números grandes en fila" },
  { tipo: "steps", nombre: "Pasos", descripcion: "Proceso numerado" },
  { tipo: "gallery", nombre: "Galería", descripcion: "Fotos con visor" },
  { tipo: "infographic", nombre: "Infografía", descripcion: "Imagen a todo el ancho" },
  { tipo: "sketchfab", nombre: "Modelo 3D", descripcion: "Embebido de Sketchfab" },
];

function bloqueVacio(tipo: BloqueInput["type"]): BloqueInput {
  switch (tipo) {
    case "text":
      return { type: "text", data: { heading: "", body: "" } };
    case "video":
      return { type: "video", data: { vimeoId: "", posterUrl: "", caption: "" } };
    case "gallery":
      return { type: "gallery", data: { caption: "", images: [] } };
    case "sketchfab":
      return { type: "sketchfab", data: { modelId: "", title: "", caption: "" } };
    case "infographic":
      return { type: "infographic", data: { url: "", alt: "", caption: "" } };
    case "stats":
      return { type: "stats", data: { items: [{ label: "", value: "", unit: "" }] } };
    case "steps":
      return { type: "steps", data: { heading: "", items: [{ title: "", body: "" }] } };
  }
}

/**
 * Editor de los bloques de una publicación.
 *
 * Los bloques son una lista ordenada: se agregan, se reordenan y se borran.
 * El orden acá es el orden en que se leen en el sitio, sin excepciones —salvo
 * que la ficha empiece con video + texto, que se muestran apareados.
 */
export default function BlockEditor({ bloques, onChange }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const actualizar = (i: number, bloque: BloqueInput) =>
    onChange(bloques.map((b, j) => (j === i ? bloque : b)));

  const mover = (i: number, delta: number) => {
    const destino = i + delta;
    if (destino < 0 || destino >= bloques.length) return;
    const copia = [...bloques];
    [copia[i], copia[destino]] = [copia[destino], copia[i]];
    onChange(copia);
  };

  const agregar = (tipo: BloqueInput["type"]) => {
    onChange([...bloques, bloqueVacio(tipo)]);
    setMenuAbierto(false);
  };

  return (
    <div className="space-y-3">
      {bloques.length === 0 && (
        <p className="label-tech rounded-lg border border-dashed border-line px-4 py-8 text-center text-ink-faint">
          Sin bloques todavía
        </p>
      )}

      {bloques.map((bloque, i) => (
        <article key={i} className="rounded-lg border border-line bg-surface">
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
            <span className="label-tech text-cyan">
              {String(i + 1).padStart(2, "0")} ·{" "}
              {TIPOS.find((t) => t.tipo === bloque.type)?.nombre ?? bloque.type}
            </span>
            <div className="flex items-center gap-1">
              <BotonIcono etiqueta="Subir" onClick={() => mover(i, -1)} disabled={i === 0}>
                ↑
              </BotonIcono>
              <BotonIcono
                etiqueta="Bajar"
                onClick={() => mover(i, 1)}
                disabled={i === bloques.length - 1}
              >
                ↓
              </BotonIcono>
              <BotonIcono
                etiqueta="Eliminar bloque"
                peligro
                onClick={() => onChange(bloques.filter((_, j) => j !== i))}
              >
                ✕
              </BotonIcono>
            </div>
          </header>

          <div className="space-y-3.5 p-4">
            <CamposDeBloque bloque={bloque} onChange={(b) => actualizar(i, b)} />
          </div>
        </article>
      ))}

      <div className="relative">
        <Boton type="button" onClick={() => setMenuAbierto((v) => !v)}>
          + Agregar bloque
        </Boton>

        {menuAbierto && (
          <div className="panel absolute bottom-full left-0 z-20 mb-2 w-72 overflow-hidden p-1">
            {TIPOS.map((t) => (
              <button
                key={t.tipo}
                type="button"
                onClick={() => agregar(t.tipo)}
                className="block w-full rounded px-3 py-2.5 text-left transition-colors hover:bg-cyan/10"
              >
                <span className="block text-[13px] font-medium text-ink">{t.nombre}</span>
                <span className="block text-[11.5px] text-ink-faint">{t.descripcion}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CamposDeBloque({
  bloque,
  onChange,
}: {
  bloque: BloqueInput;
  onChange: (b: BloqueInput) => void;
}) {
  switch (bloque.type) {
    case "text":
      return (
        <>
          <Campo
            etiqueta="Título del bloque"
            value={bloque.data.heading ?? ""}
            onChange={(heading) => onChange({ ...bloque, data: { ...bloque.data, heading } })}
            placeholder="Opcional"
          />
          <Area
            etiqueta="Texto"
            ayuda="Una línea en blanco separa párrafos. **Así** se pone en negrita."
            rows={7}
            value={bloque.data.body}
            onChange={(body) => onChange({ ...bloque, data: { ...bloque.data, body } })}
          />
        </>
      );

    case "video":
      return (
        <>
          <Campo
            etiqueta="ID de Vimeo"
            ayuda="123456789 · o 123456789/hash si el video es no listado"
            value={bloque.data.vimeoId}
            onChange={(vimeoId) => onChange({ ...bloque, data: { ...bloque.data, vimeoId } })}
          />
          <SubirImagen
            etiqueta="Póster"
            ayuda="Si se deja vacío, se usa la portada de la publicación."
            carpeta="posters"
            value={bloque.data.posterUrl ?? ""}
            onChange={(posterUrl) => onChange({ ...bloque, data: { ...bloque.data, posterUrl } })}
          />
          <Campo
            etiqueta="Epígrafe"
            value={bloque.data.caption ?? ""}
            onChange={(caption) => onChange({ ...bloque, data: { ...bloque.data, caption } })}
          />
        </>
      );

    case "stats":
      return (
        <ListaEditable
          items={bloque.data.items}
          vacio={{ label: "", value: "", unit: "" }}
          onChange={(items) => onChange({ ...bloque, data: { items } })}
          etiquetaAgregar="Agregar cifra"
          render={(item, set) => (
            <div className="grid gap-2.5 sm:grid-cols-[1.4fr_1fr_0.6fr]">
              <Campo etiqueta="Concepto" value={item.label} onChange={(label) => set({ ...item, label })} />
              <Campo etiqueta="Valor" value={item.value} onChange={(value) => set({ ...item, value })} />
              <Campo etiqueta="Unidad" value={item.unit ?? ""} onChange={(unit) => set({ ...item, unit })} />
            </div>
          )}
        />
      );

    case "steps":
      return (
        <>
          <Campo
            etiqueta="Título del bloque"
            value={bloque.data.heading ?? ""}
            onChange={(heading) => onChange({ ...bloque, data: { ...bloque.data, heading } })}
          />
          <ListaEditable
            items={bloque.data.items}
            vacio={{ title: "", body: "" }}
            onChange={(items) => onChange({ ...bloque, data: { ...bloque.data, items } })}
            etiquetaAgregar="Agregar paso"
            render={(item, set) => (
              <div className="space-y-2.5">
                <Campo etiqueta="Paso" value={item.title} onChange={(title) => set({ ...item, title })} />
                <Area etiqueta="Descripción" rows={2} value={item.body} onChange={(body) => set({ ...item, body })} />
              </div>
            )}
          />
        </>
      );

    case "gallery":
      return (
        <>
          <ListaEditable
            items={bloque.data.images}
            vacio={{ url: "", alt: "" }}
            onChange={(images) => onChange({ ...bloque, data: { ...bloque.data, images } })}
            etiquetaAgregar="Agregar foto"
            render={(item, set) => (
              <div className="space-y-2.5">
                <SubirImagen
                  etiqueta="Foto"
                  carpeta="galerias"
                  value={item.url}
                  onChange={(url) => set({ ...item, url })}
                />
                <Campo
                  etiqueta="Texto alternativo"
                  ayuda="Qué se ve en la foto. Lo leen los lectores de pantalla."
                  value={item.alt ?? ""}
                  onChange={(alt) => set({ ...item, alt })}
                />
              </div>
            )}
          />
          <Campo
            etiqueta="Epígrafe de la galería"
            value={bloque.data.caption ?? ""}
            onChange={(caption) => onChange({ ...bloque, data: { ...bloque.data, caption } })}
          />
        </>
      );

    case "infographic":
      return (
        <>
          <SubirImagen
            etiqueta="Infografía"
            carpeta="infografias"
            value={bloque.data.url}
            onChange={(url) => onChange({ ...bloque, data: { ...bloque.data, url } })}
          />
          <Campo
            etiqueta="Texto alternativo"
            value={bloque.data.alt ?? ""}
            onChange={(alt) => onChange({ ...bloque, data: { ...bloque.data, alt } })}
          />
          <Campo
            etiqueta="Epígrafe"
            value={bloque.data.caption ?? ""}
            onChange={(caption) => onChange({ ...bloque, data: { ...bloque.data, caption } })}
          />
        </>
      );

    case "sketchfab":
      return (
        <>
          <Campo
            etiqueta="ID del modelo"
            ayuda="El hash de la URL: sketchfab.com/3d-models/nombre-ESTE-ID"
            value={bloque.data.modelId}
            onChange={(modelId) => onChange({ ...bloque, data: { ...bloque.data, modelId } })}
          />
          <Campo
            etiqueta="Título"
            value={bloque.data.title ?? ""}
            onChange={(title) => onChange({ ...bloque, data: { ...bloque.data, title } })}
          />
          <Campo
            etiqueta="Epígrafe"
            value={bloque.data.caption ?? ""}
            onChange={(caption) => onChange({ ...bloque, data: { ...bloque.data, caption } })}
          />
        </>
      );
  }
}

/** Lista de sub-ítems (cifras, pasos, fotos) con alta, baja y reordenamiento. */
function ListaEditable<T>({
  items,
  vacio,
  onChange,
  render,
  etiquetaAgregar,
}: {
  items: T[];
  vacio: T;
  onChange: (items: T[]) => void;
  render: (item: T, set: (nuevo: T) => void) => React.ReactNode;
  etiquetaAgregar: string;
}) {
  const mover = (i: number, delta: number) => {
    const destino = i + delta;
    if (destino < 0 || destino >= items.length) return;
    const copia = [...items];
    [copia[i], copia[destino]] = [copia[destino], copia[i]];
    onChange(copia);
  };

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-line/70 bg-abyss/40 p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="label-tech text-[9px] text-ink-faint">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex gap-1">
              <BotonIcono etiqueta="Subir" onClick={() => mover(i, -1)} disabled={i === 0}>
                ↑
              </BotonIcono>
              <BotonIcono
                etiqueta="Bajar"
                onClick={() => mover(i, 1)}
                disabled={i === items.length - 1}
              >
                ↓
              </BotonIcono>
              <BotonIcono
                etiqueta="Quitar"
                peligro
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                ✕
              </BotonIcono>
            </div>
          </div>
          {render(item, (nuevo) => onChange(items.map((it, j) => (j === i ? nuevo : it))))}
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...items, vacio])}
        className="label-tech w-full rounded-lg border border-dashed border-line py-2.5 text-ink-faint transition-colors hover:border-cyan/40 hover:text-cyan"
      >
        + {etiquetaAgregar}
      </button>
    </div>
  );
}

function BotonIcono({
  children,
  etiqueta,
  onClick,
  disabled,
  peligro,
}: {
  children: React.ReactNode;
  etiqueta: string;
  onClick: () => void;
  disabled?: boolean;
  peligro?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={etiqueta}
      aria-label={etiqueta}
      className={`grid h-7 w-7 place-items-center rounded text-[12px] transition-colors disabled:opacity-25 ${
        peligro ? "text-ink-faint hover:bg-amber/10 hover:text-amber" : "text-ink-faint hover:bg-white/5 hover:text-cyan"
      }`}
    >
      {children}
    </button>
  );
}
