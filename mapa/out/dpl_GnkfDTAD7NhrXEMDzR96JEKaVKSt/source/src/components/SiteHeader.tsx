"use client";

import { useState } from "react";
import Link from "next/link";
import { CIFRAS } from "@/data/obra";

interface Props {
  /** Ruta activa, para marcar el ítem correspondiente. */
  activo?: "traza" | "serie";
  /** Sobre el mapa el header flota; en las fichas se apoya en el fondo. */
  variante?: "flotante" | "solido";
  /** Bloque libre a la derecha (ej. el título de la publicación abierta). */
  derecha?: React.ReactNode;
  /**
   * Cuántos especiales hay publicados. Solo se usa en la home (`activo ===
   * "traza"`): ahí el header además muestra las cifras de la obra, que antes
   * vivían en una tarjeta aparte flotando sobre el mapa.
   */
  contenidos?: number;
}

const NAV = [
  { href: "/", clave: "traza", texto: "Traza" },
  { href: "/serie", clave: "serie", texto: "Serie" },
] as const;

export default function SiteHeader({ activo, variante = "flotante", derecha, contenidos }: Props) {
  return (
    <header
      className={`z-30 flex flex-col gap-2.5 px-4 py-4 md:px-8 md:py-5 ${
        variante === "flotante"
          ? "absolute inset-x-0 top-0 bg-gradient-to-b from-abyss/85 to-transparent"
          : "sticky top-0 border-b border-line bg-abyss/85 backdrop-blur-xl"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 outline-none">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded border border-cyan/40 bg-cyan/10">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="#4ecdf5" strokeWidth="1.3">
              <path d="M1.5 11.5c3-4 5-1 7-4s4-1 6-3" strokeLinecap="round" />
              <circle cx="3" cy="10.2" r="1.1" fill="#4ecdf5" stroke="none" />
              <circle cx="13" cy="5" r="1.1" fill="#4ecdf5" stroke="none" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-semibold tracking-tight whitespace-nowrap text-ink">
              Programa Duplicar Norte
            </span>
            <span className="label-tech hidden text-[9px] whitespace-nowrap text-ink-faint sm:block">
              Oldelval · Auca Mahuida — Allen
            </span>
          </span>
        </Link>

        {derecha ?? (
          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={activo === n.clave ? "page" : undefined}
                className={`label-tech rounded px-3 py-2 transition-colors ${
                  activo === n.clave
                    ? "text-cyan"
                    : "text-ink-faint hover:bg-white/5 hover:text-ink-soft"
                }`}
              >
                {n.texto}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {activo === "traza" && <DatosDeObra contenidos={contenidos} />}
    </header>
  );
}

/**
 * Cifras de la obra, como desplegable dentro del header.
 *
 * Antes era una tarjeta propia (`PanelObra`) flotando sobre el mapa, siempre
 * visible en desktop. Acá arranca siempre cerrada —en cualquier tamaño de
 * pantalla— y mantiene el mismo estilo de tabla de datos que tenía: valor
 * grande a la izquierda, etiqueta a la derecha, separadas por líneas finas.
 */
function DatosDeObra({ contenidos }: { contenidos?: number }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative self-start">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex items-center gap-2.5 rounded-full border border-line bg-abyss/70 px-3 py-1.5 backdrop-blur transition-colors hover:border-cyan/50"
      >
        <Latido />
        <span className="label-tech text-[10px] whitespace-nowrap text-ink">Datos de obra</span>
        <svg
          viewBox="0 0 16 16"
          className={`h-3 w-3 shrink-0 text-cyan transition-transform duration-300 ${abierto ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {abierto && (
        <div className="panel absolute top-full left-0 mt-2 w-[248px] overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5">
            <span className="flex items-center gap-2">
              <Latido />
              <span className="label-tech text-[9px] text-mint">En obra</span>
            </span>
            {typeof contenidos === "number" && (
              <span className="label-tech text-[9px] text-ink-faint">{contenidos} contenidos</span>
            )}
          </header>

          <dl className="px-3.5 pt-1 pb-1">
            {CIFRAS.map((c) => (
              <div
                key={c.etiqueta}
                className="flex items-baseline justify-between gap-3 border-t border-line/70 py-2.5 first:border-t-0"
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
        </div>
      )}
    </div>
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
