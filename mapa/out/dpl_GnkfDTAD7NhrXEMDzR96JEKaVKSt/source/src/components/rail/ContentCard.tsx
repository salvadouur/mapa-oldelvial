import Link from "next/link";
import Cover from "@/components/Cover";
import { formatDuracion, formatFecha } from "@/lib/format";
import type { Content } from "@/lib/types";

interface Props {
  contenido: Content;
  /** Destaca la primera tarjeta de la fila de novedades. */
  destacado?: boolean;
}

/** Ruta de consumo según el tipo: playlist de la serie o ficha del especial. */
export function hrefDeContenido(c: Content): string {
  return c.type === "simple" ? `/serie/${c.slug}` : `/contenido/${c.slug}`;
}

export default function ContentCard({ contenido, destacado = false }: Props) {
  // Sin título: la miniatura ya lleva el nombre quemado en el primer frame, así
  // que repetirlo debajo era redundante. Queda la sinopsis, que es lo que la
  // portada no cuenta, más la ficha técnica.
  const meta = [
    contenido.durationSeconds ? formatDuracion(contenido.durationSeconds) : null,
    formatFecha(contenido.publishedAt),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={hrefDeContenido(contenido)}
      className="group panel relative flex shrink-0 flex-col overflow-hidden transition-[transform,border-color] duration-300 outline-none hover:-translate-y-1 hover:border-cyan/45 focus-visible:border-cyan focus-visible:ring-2 focus-visible:ring-cyan/40"
      // Todas del mismo tamaño: lo que distingue a la primera es la chapa
      // "Nuevo", no el ancho. Una tarjeta más grande estiraba la fila entera y
      // le comía altura al mapa sin agregar información.
      style={{ width: "min(66vw, 244px)" }}
    >
      <div className="relative aspect-video overflow-hidden">
        <Cover
          slug={contenido.slug}
          url={contenido.coverUrl}
          alt={contenido.title}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
          etiqueta={contenido.locationName}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-abyss/85 via-transparent to-transparent" />

        {destacado && (
          <span className="label-tech absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded bg-abyss/85 px-2 py-1 text-[9px] text-mint">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            Nuevo
          </span>
        )}

        {contenido.kp && !destacado && (
          <span className="label-tech absolute top-2.5 left-2.5 rounded bg-abyss/80 px-2 py-1 text-[9px] text-cyan">
            {contenido.kp}
          </span>
        )}

        {contenido.vimeoId && (
          <span className="absolute right-2.5 bottom-2.5 grid h-8 w-8 place-items-center rounded-full bg-abyss/70 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
            <svg viewBox="0 0 16 16" className="ml-0.5 h-3.5 w-3.5 fill-ink">
              <path d="M4 2.5v11l9.5-5.5z" />
            </svg>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3.5 py-3">
        <p className="line-clamp-2 min-h-[2.6em] text-[13px] leading-relaxed text-ink">
          {contenido.summary ?? contenido.title}
        </p>
        {meta && <p className="label-tech mt-auto text-[9px] text-ink-faint">{meta}</p>}
      </div>
    </Link>
  );
}
