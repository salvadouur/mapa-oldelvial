"use client";

import { useState } from "react";
import Link from "next/link";
import type { Rail } from "@/lib/types";
import { ALTO_CAJON_MAX, ALTO_CAJON_RELATIVO } from "./medidas";
import ContentRail from "./ContentRail";

interface Props {
  rails: Rail[];
}

/**
 * Cajón de contenidos sobre el mapa.
 *
 * La home no scrollea: el mapa se queda con la rueda del mouse para el zoom, y
 * el catálogo vive en este cajón con dos estados. Contraído muestra la primera
 * fila; expandido despliega el resto con scroll propio. Así ninguno de los dos
 * gestos —zoom y navegación de contenidos— le roba el scroll al otro.
 */
export default function ContentDrawer({ rails }: Props) {
  const [expandido, setExpandido] = useState(false);

  if (rails.length === 0) return null;

  const [primera, ...resto] = rails;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col transition-[max-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        maxHeight: expandido
          ? "80dvh"
          : `min(${ALTO_CAJON_RELATIVO * 100}dvh, ${ALTO_CAJON_MAX}px)`,
      }}
    >
      <div className="scrim-bottom pointer-events-none absolute inset-x-0 -top-24 bottom-0" />

      <div className="relative flex items-center justify-between gap-4 px-4 pb-2 md:px-8">
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          aria-expanded={expandido}
          className="group flex items-center gap-2 rounded-full border border-line bg-abyss/80 px-3.5 py-1.5 backdrop-blur transition-colors hover:border-cyan/50"
        >
          <svg
            viewBox="0 0 16 16"
            className={`h-3 w-3 text-cyan transition-transform duration-300 ${expandido ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M3 10l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="label-tech text-ink-soft group-hover:text-ink">
            {expandido ? "Contraer" : "Todo el contenido"}
          </span>
        </button>

        <Link
          href="/serie"
          className="label-tech hidden items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-3.5 py-1.5 text-cyan transition-colors hover:bg-cyan/20 sm:flex"
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current">
            <path d="M4 2.5v11l9.5-5.5z" />
          </svg>
          Ver la serie
        </Link>
      </div>

      <div className="no-scrollbar relative flex-1 space-y-6 overflow-y-auto pb-5">
        <ContentRail rail={primera} destacarPrimero />
        {expandido && resto.map((r) => <ContentRail key={r.id} rail={r} />)}
      </div>
    </div>
  );
}
