"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  borrarFila,
  guardarFila,
  guardarItemsDeFila,
} from "@/app/admin/actions";
import { Boton, Campo } from "@/components/admin/campos";
import { slugify } from "@/lib/format";
import type { Content, Rail } from "@/lib/types";

interface Props {
  filas: Rail[];
  contenidos: Content[];
}

export default function EditorCarrusel({ filas, contenidos }: Props) {
  const router = useRouter();
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [pendiente, iniciar] = useTransition();

  function crear() {
    const title = nuevoTitulo.trim();
    if (!title) return;

    iniciar(async () => {
      await guardarFila({
        slug: slugify(title),
        title,
        orderIndex: filas.length + 1,
        visible: true,
      });
      setNuevoTitulo("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {filas.map((fila) => (
        <FilaCarrusel key={fila.id} fila={fila} contenidos={contenidos} />
      ))}

      <section className="panel p-5">
        <h2 className="mb-3 text-[15px] font-semibold tracking-tight text-ink">Nueva fila</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <Campo
              etiqueta="Título"
              value={nuevoTitulo}
              onChange={setNuevoTitulo}
              placeholder="Cruces especiales y ensayos"
            />
          </div>
          <Boton variante="primario" onClick={crear} disabled={pendiente || !nuevoTitulo.trim()}>
            Crear fila
          </Boton>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FilaCarrusel({ fila, contenidos }: { fila: Rail; contenidos: Content[] }) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<string[]>(fila.items.map((i) => i.id));
  const [pendiente, iniciar] = useTransition();

  const sucio =
    seleccion.length !== fila.items.length ||
    seleccion.some((id, i) => id !== fila.items[i]?.id);

  const disponibles = contenidos.filter((c) => !seleccion.includes(c.id));

  const mover = (i: number, delta: number) => {
    const destino = i + delta;
    if (destino < 0 || destino >= seleccion.length) return;
    const copia = [...seleccion];
    [copia[i], copia[destino]] = [copia[destino], copia[i]];
    setSeleccion(copia);
  };

  const porId = new Map(contenidos.map((c) => [c.id, c]));

  function guardar() {
    iniciar(async () => {
      await guardarItemsDeFila(fila.id, seleccion);
      router.refresh();
    });
  }

  function eliminar() {
    if (!confirm(`¿Eliminar la fila "${fila.title}"? Los contenidos no se borran.`)) return;
    iniciar(async () => {
      await borrarFila(fila.id);
      router.refresh();
    });
  }

  return (
    <section className="panel p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{fila.title}</h2>
          <p className="label-tech mt-1 text-[9px] text-ink-faint">
            /{fila.slug} · {seleccion.length} contenido{seleccion.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sucio && (
            <Boton variante="primario" onClick={guardar} disabled={pendiente}>
              {pendiente ? "Guardando…" : "Guardar orden"}
            </Boton>
          )}
          <Boton variante="peligro" onClick={eliminar} disabled={pendiente}>
            Eliminar fila
          </Boton>
        </div>
      </header>

      <ol className="mb-3 space-y-1.5">
        {seleccion.map((id, i) => {
          const c = porId.get(id);
          return (
            <li
              key={id}
              className="flex items-center gap-3 rounded-lg border border-line bg-abyss/40 px-3 py-2"
            >
              <span className="label-tech w-5 text-[9px] text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                {c?.title ?? "(contenido eliminado)"}
                {c?.status === "draft" && (
                  <span className="label-tech ml-2 text-[8px] text-amber">Borrador</span>
                )}
              </span>
              <div className="flex gap-1">
                <Mini etiqueta="Subir" onClick={() => mover(i, -1)} disabled={i === 0}>
                  ↑
                </Mini>
                <Mini
                  etiqueta="Bajar"
                  onClick={() => mover(i, 1)}
                  disabled={i === seleccion.length - 1}
                >
                  ↓
                </Mini>
                <Mini
                  etiqueta="Quitar"
                  peligro
                  onClick={() => setSeleccion(seleccion.filter((s) => s !== id))}
                >
                  ✕
                </Mini>
              </div>
            </li>
          );
        })}
        {seleccion.length === 0 && (
          <li className="label-tech rounded-lg border border-dashed border-line py-6 text-center text-ink-faint">
            Fila vacía · no se muestra en el sitio
          </li>
        )}
      </ol>

      {disponibles.length > 0 && (
        <label className="block">
          <span className="label-tech mb-1.5 block text-ink-faint">Agregar contenido</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) setSeleccion([...seleccion, e.target.value]);
            }}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] text-ink outline-none focus:border-cyan"
          >
            <option value="">Elegir…</option>
            {disponibles.map((c) => (
              <option key={c.id} value={c.id} className="bg-surface">
                {c.title} {c.status === "draft" ? "(borrador)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}

function Mini({
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
        peligro
          ? "text-ink-faint hover:bg-amber/10 hover:text-amber"
          : "text-ink-faint hover:bg-white/5 hover:text-cyan"
      }`}
    >
      {children}
    </button>
  );
}
