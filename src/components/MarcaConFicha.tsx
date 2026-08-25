"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CIFRAS, OBRA } from "@/data/obra";

interface Props {
  logo: string | null;
  /** Logo de Oldelval, para el encabezado de la ficha. */
  logoTitular: string | null;
  /** Solo en la home: en el resto del sitio la marca es apenas un enlace. */
  conFicha: boolean;
}

/**
 * Marca del programa. El logo ya dice el nombre, así que va solo — sin texto
 * repetido al lado. En la home, además, la ficha de obra se despliega del
 * propio logo.
 */
export default function MarcaConFicha({ logo, logoTitular, conFicha }: Props) {
  const [abierta, setAbierta] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  // Se cierra al hacer clic afuera o con Escape: es un desplegable sobre el
  // mapa, y quedarse abierto tapando la traza sería molesto.
  useEffect(() => {
    if (!abierta) return;

    const alClic = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierta(false);
    };
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierta(false);
    };

    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierta]);

  const marca = logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt="Programa Duplicar Norte" className="h-10 w-auto object-contain md:h-12" />
  ) : (
    <span className="text-[13px] font-bold tracking-tight whitespace-nowrap text-white">
      Programa Duplicar Norte
    </span>
  );

  if (!conFicha) {
    return (
      <Link href="/" className="flex items-center outline-none">
        {marca}
      </Link>
    );
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        aria-label="Datos del Programa Duplicar Norte"
        className="flex items-center gap-2 outline-none"
      >
        {marca}
        <svg
          viewBox="0 0 16 16"
          className={`h-3 w-3 shrink-0 text-white/70 transition-transform duration-300 ${abierta ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {abierta && <FichaDeObra logoTitular={logoTitular} />}
    </div>
  );
}

function FichaDeObra({ logoTitular }: { logoTitular: string | null }) {
  return (
    <section className="glass absolute top-full left-0 z-50 mt-3 w-[276px] overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-3">
        <span className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
          </span>
          <span className="label-tech text-[9px] text-white">En obra</span>
        </span>
        {logoTitular ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoTitular} alt={OBRA.titular} className="h-3.5 w-auto object-contain" />
        ) : (
          <span className="label-tech text-[9px] text-white">{OBRA.titular}</span>
        )}
      </header>

      <div className="px-4 pt-3.5 pb-1">
        <p className="text-[13px] leading-relaxed font-normal text-white">{OBRA.bajada}</p>
      </div>

      <dl className="px-4 pb-3">
        {CIFRAS.map((c) => (
          <div
            key={c.etiqueta}
            className="flex items-baseline justify-between gap-3 border-t border-white/15 py-2.5"
          >
            <dd className="flex items-baseline gap-0.5">
              <span className="text-xl leading-none font-bold tracking-tight text-white">
                {c.valor}
              </span>
              {c.unidad && <span className="label-tech text-[9px] text-white/80">{c.unidad}</span>}
            </dd>
            <dt className="label-tech text-right text-[8.5px] text-white/70">{c.etiqueta}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
