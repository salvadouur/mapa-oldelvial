"use client";

import { useState } from "react";
import { CIFRAS, OBRA } from "@/data/obra";

interface Props {
  /** Cuántos especiales hay publicados sobre la traza. */
  contenidos: number;
  onEncuadrar: () => void;
}

/**
 * Ficha de la obra, con lenguaje de pantalla de instrumento.
 *
 * Formato vertical: las cifras se apilan en filas separadas por hairlines, una
 * debajo de la otra, como un panel de lecturas.
 *
 * En pantallas chicas arranca contraída en una sola línea. Desplegada ocupa más
 * de la mitad del alto útil del teléfono, y ahí el mapa —que es lo que el
 * usuario vino a ver— deja de existir. Desde `md` no hay nada que contraer:
 * sobra lugar al costado de la traza.
 */
export default function PanelObra({ contenidos, onEncuadrar }: Props) {
  const [abierta, setAbierta] = useState(false);

  return (
    <section className="panel w-fit overflow-hidden md:w-[248px]">
      {/* Solo en móvil: la línea que despliega */}
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 md:hidden"
      >
        <Latido />
        {/* El nombre completo del programa ya está en el header, justo arriba:
            acá alcanza con decir qué se despliega. */}
        <span className="label-tech text-[10px] whitespace-nowrap text-ink">Datos de obra</span>
        <svg
          viewBox="0 0 16 16"
          className={`h-3 w-3 shrink-0 text-cyan transition-transform duration-300 ${abierta ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={`${abierta ? "block" : "hidden"} w-[248px] md:block`}>
        {/* Barra de estado: en móvil el latido ya está en la línea de arriba */}
        <header className="hidden items-center justify-between gap-3 border-b border-line px-3.5 py-2.5 md:flex">
          <span className="flex items-center gap-2">
            <Latido />
            <span className="label-tech text-[9px] text-mint">En obra</span>
          </span>
          <span className="label-tech text-[9px] text-ink-faint">{contenidos} contenidos</span>
        </header>

        <div className="border-t border-line px-3.5 pt-3 pb-1 md:border-t-0">
          <p className="label-tech text-cyan">{OBRA.titular}</p>
          <h2 className="mt-1 text-lg leading-tight font-semibold tracking-tight text-ink">
            {OBRA.nombre}
          </h2>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">{OBRA.bajada}</p>
        </div>

        <dl className="px-3.5 pb-1">
          {CIFRAS.map((c) => (
            <div
              key={c.etiqueta}
              className="flex items-baseline justify-between gap-3 border-t border-line/70 py-2.5"
            >
              <dd className="flex items-baseline gap-0.5">
                <span className="text-xl leading-none font-semibold tracking-tight text-cyan">
                  {c.valor}
                </span>
                {c.unidad && (
                  <span className="label-tech text-[9px] text-ink-soft">{c.unidad}</span>
                )}
              </dd>
              <dt className="label-tech text-right text-[8.5px] text-ink-faint">{c.etiqueta}</dt>
            </div>
          ))}
        </dl>

        <footer className="border-t border-line">
          <button
            type="button"
            onClick={onEncuadrar}
            title="Ver la traza completa"
            className="label-tech w-full px-3.5 py-2.5 text-left text-ink-faint transition-colors hover:text-cyan"
          >
            Encuadrar traza
          </button>
        </footer>
      </div>
    </section>
  );
}

function Latido() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
    </span>
  );
}
