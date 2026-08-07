"use client";

import dynamic from "next/dynamic";
import type { MappedContent } from "@/lib/types";

/**
 * MapLibre toca `window` al instanciarse, así que el mapa se carga solo en el
 * navegador. Este envoltorio existe únicamente para poder usar `ssr: false`,
 * que en el App Router solo se permite dentro de un Client Component.
 */
const TrazaMap = dynamic(() => import("./TrazaMap"), {
  ssr: false,
  loading: () => <MapaCargando />,
});

export default function MapaCliente(props: {
  contenidos: MappedContent[];
  traza: [number, number][];
  paddingInferior?: number;
}) {
  return <TrazaMap {...props} />;
}

function MapaCargando() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-deep">
      <div className="flex flex-col items-center gap-3">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-cyan" />
        <span className="label-tech text-ink-faint">Cargando la traza</span>
      </div>
    </div>
  );
}
