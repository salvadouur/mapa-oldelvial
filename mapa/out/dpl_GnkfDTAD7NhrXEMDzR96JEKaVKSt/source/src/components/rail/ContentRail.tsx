"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Rail } from "@/lib/types";
import ContentCard from "./ContentCard";

interface Props {
  rail: Rail;
  /** Marca como "nuevo" el primer ítem (se usa en la fila de novedades). */
  destacarPrimero?: boolean;
  /** Enlace opcional al final de la fila (ej. "ver la serie completa"). */
  accion?: { href: string; texto: string };
}

/**
 * Fila horizontal del carrusel.
 *
 * Scroll nativo con snap —que es lo que hace que en touch se sienta bien— más
 * flechas en desktop. Las flechas se ocultan cuando no hay a dónde ir, para no
 * ofrecer un control muerto.
 */
export default function ContentRail({ rail, destacarPrimero = false, accion }: Props) {
  const pista = useRef<HTMLDivElement>(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);

  /**
   * Si la primera/última tarjeta quedan fuera del área visible, en vez de
   * comparar `scrollLeft` contra un umbral en píxeles. Con scroll-snap el
   * reposo al volver al principio no siempre cae en `scrollLeft === 0` —en
   * los tests quedó en 32px—, así que un umbral chico como el que había antes
   * (8px) dejaba la flecha izquierda prendida aunque no hubiera nada más para
   * el costado. El margen acá es para el redondeo del snap, no para tapar
   * scroll real: una tarjeta mide 200px o más, así que 40px nunca esconde un
   * desplazamiento genuino.
   */
  const revisarLimites = useCallback(() => {
    const el = pista.current;
    const primero = el?.firstElementChild as HTMLElement | null;
    const ultimo = el?.lastElementChild as HTMLElement | null;
    if (!el || !primero || !ultimo) return;

    const margen = 40;
    const rectPista = el.getBoundingClientRect();
    setPuedeIzq(primero.getBoundingClientRect().left < rectPista.left - margen);
    setPuedeDer(ultimo.getBoundingClientRect().right > rectPista.right + margen);
  }, []);

  useEffect(() => {
    revisarLimites();
    const el = pista.current;
    if (!el) return;
    const ro = new ResizeObserver(revisarLimites);
    ro.observe(el);
    return () => ro.disconnect();
  }, [revisarLimites]);

  const desplazar = (dir: -1 | 1) => {
    const el = pista.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: "smooth" });
  };

  if (rail.items.length === 0) return null;

  return (
    <section className="group/rail relative">
      <header className="mb-3 flex items-end justify-between gap-4 px-6 md:px-8">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink md:text-base">
          {rail.title}
        </h2>
        {accion && (
          <Link
            href={accion.href}
            className="label-tech shrink-0 text-ink-faint transition-colors hover:text-cyan"
          >
            {accion.texto} →
          </Link>
        )}
      </header>

      <div className="relative">
        <div
          ref={pista}
          onScroll={revisarLimites}
          className="no-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-smooth px-6 pt-1 pb-3 md:gap-4 md:px-8"
        >
          {rail.items.map((c, i) => (
            <div key={c.id} className="snap-start">
              <ContentCard contenido={c} destacado={destacarPrimero && i === 0} />
            </div>
          ))}
        </div>

        {puedeIzq && (
          <FlechaRail direccion="izquierda" onClick={() => desplazar(-1)} />
        )}
        {puedeDer && <FlechaRail direccion="derecha" onClick={() => desplazar(1)} />}
      </div>
    </section>
  );
}

function FlechaRail({
  direccion,
  onClick,
}: {
  direccion: "izquierda" | "derecha";
  onClick: () => void;
}) {
  const izq = direccion === "izquierda";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={izq ? "Anterior" : "Siguiente"}
      className={`absolute top-0 bottom-3 z-10 hidden w-12 items-center justify-center bg-gradient-to-r opacity-0 transition-opacity duration-200 group-hover/rail:opacity-100 focus-visible:opacity-100 md:flex ${
        izq ? "left-0 from-abyss to-transparent" : "right-0 from-transparent to-abyss"
      }`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full border border-line bg-abyss/85 text-ink-soft backdrop-blur transition-colors hover:border-cyan/50 hover:text-cyan">
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d={izq ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
