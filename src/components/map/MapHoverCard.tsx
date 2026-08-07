"use client";

import Link from "next/link";
import Cover from "@/components/Cover";
import { formatDuracion } from "@/lib/format";
import type { MappedContent } from "@/lib/types";

interface Props {
  contenido: MappedContent;
  /** Posición del punto en píxeles de pantalla, ya proyectada por el mapa. */
  x: number;
  y: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onCerrar: () => void;
}

const ANCHO = 284;

/**
 * Ficha flotante que aparece al posar el mouse sobre un punto de la traza.
 * Se ancla al punto y se voltea sola cuando quedaría fuera del viewport.
 */
export default function MapHoverCard({
  contenido,
  x,
  y,
  onMouseEnter,
  onMouseLeave,
  onCerrar,
}: Props) {
  const ancho = typeof window !== "undefined" ? window.innerWidth : 1280;
  const alto = typeof window !== "undefined" ? window.innerHeight : 800;

  // Si el punto está muy a la derecha o muy abajo, la tarjeta cambia de lado.
  const haciaIzquierda = x + ANCHO / 2 + 24 > ancho;
  const haciaDerecha = x - ANCHO / 2 - 24 < 0;
  const debajo = y < 300;

  const left = haciaIzquierda ? x - ANCHO - 18 : haciaDerecha ? x + 18 : x - ANCHO / 2;
  const top = debajo ? y + 22 : undefined;
  const bottom = debajo ? undefined : alto - y + 22;

  return (
    <div
      className="pointer-events-auto absolute z-30 aparece"
      style={{ left, top, bottom, width: ANCHO }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="panel overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]">
        <Link href={`/contenido/${contenido.slug}`} className="block">
          <div className="relative aspect-video">
            <Cover
              slug={contenido.slug}
              url={contenido.coverUrl}
              alt={contenido.title}
              etiqueta={contenido.locationName}
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-abyss/95 to-transparent" />
            {contenido.kp && (
              <span className="label-tech absolute top-2.5 left-2.5 rounded bg-abyss/80 px-2 py-1 text-[9px] text-cyan">
                {contenido.kp}
              </span>
            )}
          </div>

          <div className="space-y-1.5 p-3.5">
            <p className="label-tech text-cyan">
              Especial
              {contenido.durationSeconds ? ` · ${formatDuracion(contenido.durationSeconds)}` : ""}
            </p>
            <h3 className="text-[15px] leading-snug font-semibold text-ink">{contenido.title}</h3>
            {contenido.summary && (
              <p className="line-clamp-3 text-[12.5px] leading-relaxed text-ink-soft">
                {contenido.summary}
              </p>
            )}
          </div>
        </Link>

        {/* En touch no hay hover: hace falta un botón explícito. */}
        <div className="flex items-center justify-between border-t border-line px-3.5 py-2 lg:hidden">
          <button
            type="button"
            onClick={onCerrar}
            className="label-tech text-ink-faint transition-colors hover:text-ink-soft"
          >
            Cerrar
          </button>
          <Link href={`/contenido/${contenido.slug}`} className="label-tech text-cyan">
            Ver especial →
          </Link>
        </div>
      </div>
    </div>
  );
}
