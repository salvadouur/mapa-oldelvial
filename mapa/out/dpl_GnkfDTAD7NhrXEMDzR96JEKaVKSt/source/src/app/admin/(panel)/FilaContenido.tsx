"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Cover from "@/components/Cover";
import { cambiarEstado } from "@/app/admin/actions";
import type { Content } from "@/lib/types";

/**
 * Una fila del listado. Publicar y despublicar se hacen desde acá sin entrar al
 * editor: es la acción más frecuente del día a día.
 */
export default function FilaContenido({
  contenido,
  meta,
}: {
  contenido: Content;
  meta: string;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const publicado = contenido.status === "published";

  function alternar() {
    iniciar(async () => {
      await cambiarEstado(contenido.id, publicado ? "draft" : "published");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4 bg-surface px-4 py-3 transition-colors hover:bg-surface-2">
      <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded border border-line">
        <Cover slug={contenido.slug} url={contenido.coverUrl} alt="" />
      </span>

      <Link href={`/admin/contenido/${contenido.id}`} className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14px] font-medium text-ink">
            {contenido.title || "Sin título"}
          </span>
          <span
            className={`label-tech shrink-0 rounded px-1.5 py-0.5 text-[8px] ${
              publicado ? "bg-mint/15 text-mint" : "bg-line text-ink-faint"
            }`}
          >
            {publicado ? "Publicado" : "Borrador"}
          </span>
        </span>
        <span className="label-tech mt-1 block truncate text-[9px] text-ink-faint">{meta}</span>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={alternar}
          disabled={pendiente}
          className="label-tech rounded-lg border border-line px-3 py-2 text-ink-soft transition-colors hover:border-cyan/50 hover:text-cyan disabled:opacity-50"
        >
          {pendiente ? "…" : publicado ? "Despublicar" : "Publicar"}
        </button>
        <Link
          href={`/admin/contenido/${contenido.id}`}
          className="label-tech rounded-lg px-3 py-2 text-ink-faint transition-colors hover:text-cyan"
        >
          Editar
        </Link>
      </div>
    </div>
  );
}
