"use client";

import Link from "next/link";

const OPCIONES = [
  { href: "/", clave: "traza", texto: "Traza" },
  { href: "/serie", clave: "serie", texto: "Serie" },
] as const;

type Clave = (typeof OPCIONES)[number]["clave"];

/**
 * Conmutador Traza / Serie: un solo control con la pastilla que se desliza
 * hacia el modo activo, como un switch de visualización. Debajo siguen siendo
 * dos enlaces normales — botón central, adelante y atrás del navegador y
 * apertura en pestaña nueva funcionan igual.
 */
export default function NavToggle({ activo }: { activo?: Clave }) {
  const indice = Math.max(
    0,
    OPCIONES.findIndex((o) => o.clave === activo),
  );

  return (
    <nav className="glass relative grid grid-cols-2 overflow-hidden rounded-full p-1">
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-cyan transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(${indice * 100}%)` }}
      />
      {OPCIONES.map((o) => (
        <Link
          key={o.clave}
          href={o.href}
          aria-current={activo === o.clave ? "page" : undefined}
          className={`label-tech relative z-10 px-4 py-2 text-center text-[10px] transition-colors duration-300 md:px-5 md:text-[11px] ${
            activo === o.clave ? "text-white" : "text-white/65 hover:text-white"
          }`}
        >
          {o.texto}
        </Link>
      ))}
    </nav>
  );
}
