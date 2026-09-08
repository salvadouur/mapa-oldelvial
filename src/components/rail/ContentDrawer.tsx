"use client";

import { useEffect, useRef, useState } from "react";
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
 * el catálogo vive acá abajo. Arriba del carrusel, una invitación con flecha
 * permite plegarlo para dejar el mapa limpio — y volver a abrirlo.
 */
export default function ContentDrawer({ rails }: Props) {
  const [abierto, setAbierto] = useState(true);
  const raiz = useRef<HTMLDivElement>(null);

  // La altura real del cajón (abierto o plegado) se publica como variable CSS
  // global: el botón de encuadre y el cartel del mapa se apoyan sobre ella
  // para quedar SIEMPRE justo por encima, se pliegue o no el carrusel.
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const aplicar = () =>
      document.documentElement.style.setProperty("--alto-cajon", `${el.offsetHeight}px`);
    aplicar();
    const observador = new ResizeObserver(aplicar);
    observador.observe(el);
    return () => {
      observador.disconnect();
      document.documentElement.style.removeProperty("--alto-cajon");
    };
  }, []);

  if (rails.length === 0) return null;

  return (
    <div
      ref={raiz}
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col"
      style={
        abierto
          ? { maxHeight: `min(${ALTO_CAJON_RELATIVO * 100}dvh, ${ALTO_CAJON_MAX}px)` }
          : undefined
      }
    >
      {abierto && <div className="scrim-bottom pointer-events-none absolute inset-x-0 -top-24 bottom-0" />}

      <div className={`relative flex justify-start px-4 md:px-8 ${abierto ? "pb-1" : "pb-4"}`}>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="glass flex cursor-pointer items-center gap-2.5 rounded-full px-4 py-2 transition-colors hover:bg-black/40"
        >
          <span className="label-tech text-[9.5px] text-white">
            Conocé las novedades del proyecto
          </span>
          <svg
            viewBox="0 0 16 16"
            className={`h-3 w-3 shrink-0 text-white/70 transition-transform duration-300 ${
              abierto ? "" : "rotate-180"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {abierto && (
        <div className="no-scrollbar relative flex-1 space-y-6 overflow-y-auto pt-3 pb-5">
          {rails.map((r) => (
            <ContentRail key={r.id} rail={r} destacarPrimero={r === rails[0]} sinTitulo />
          ))}
        </div>
      )}
    </div>
  );
}
