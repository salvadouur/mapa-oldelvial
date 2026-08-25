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
 * el catálogo vive acá abajo. Sin botones de más —a la serie se llega desde el
 * header, y a cada especial desde su tarjeta— para que el mapa mande.
 */
export default function ContentDrawer({ rails }: Props) {
  if (rails.length === 0) return null;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col"
      style={{
        maxHeight: `min(${ALTO_CAJON_RELATIVO * 100}dvh, ${ALTO_CAJON_MAX}px)`,
      }}
    >
      <div className="scrim-bottom pointer-events-none absolute inset-x-0 -top-24 bottom-0" />

      <div className="no-scrollbar relative flex-1 space-y-6 overflow-y-auto pt-3 pb-5">
        {rails.map((r) => (
          <ContentRail key={r.id} rail={r} destacarPrimero={r === rails[0]} sinTitulo />
        ))}
      </div>
    </div>
  );
}
