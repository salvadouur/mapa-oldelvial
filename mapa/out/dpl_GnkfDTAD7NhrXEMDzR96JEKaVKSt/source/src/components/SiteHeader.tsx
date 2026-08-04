import Link from "next/link";

interface Props {
  /** Ruta activa, para marcar el ítem correspondiente. */
  activo?: "traza" | "serie";
  /** Sobre el mapa el header flota; en las fichas se apoya en el fondo. */
  variante?: "flotante" | "solido";
  /** Bloque libre a la derecha (ej. el título de la publicación abierta). */
  derecha?: React.ReactNode;
}

const NAV = [
  { href: "/", clave: "traza", texto: "Traza" },
  { href: "/serie", clave: "serie", texto: "Serie" },
] as const;

export default function SiteHeader({ activo, variante = "flotante", derecha }: Props) {
  return (
    <header
      className={`z-30 flex items-center justify-between gap-4 px-4 py-4 md:px-8 md:py-5 ${
        variante === "flotante"
          ? "absolute inset-x-0 top-0 bg-gradient-to-b from-abyss/85 to-transparent"
          : "sticky top-0 border-b border-line bg-abyss/85 backdrop-blur-xl"
      }`}
    >
      <Link href="/" className="flex items-center gap-3 outline-none">
        <span className="grid h-8 w-8 place-items-center rounded border border-cyan/40 bg-cyan/10">
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
    </header>
  );
}
