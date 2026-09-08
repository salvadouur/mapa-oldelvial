"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Pantalla completa manejada desde la página, no desde adentro del iframe.
 *
 * El botón nativo de Vimeo pide fullscreen desde su propio documento y, ante
 * cualquier rechazo del navegador, cae sin avisar a un modo "ventana llena"
 * dentro del iframe — que ya ocupaba todo su lugar, así que parece que no
 * hizo nada. Este botón fullscreenea el CONTENEDOR del reproductor con la
 * API del documento principal, que no tiene ese problema.
 */
export default function BotonPantallaCompleta({
  objetivo,
}: {
  objetivo: RefObject<HTMLElement | null>;
}) {
  const [activa, setActiva] = useState(false);

  useEffect(() => {
    const alCambiar = () => setActiva(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);

  const alternar = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      objetivo.current?.requestFullscreen?.().catch(() => {});
    }
  };

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={activa ? "Salir de pantalla completa" : "Pantalla completa"}
      title={activa ? "Salir de pantalla completa" : "Pantalla completa"}
      className="absolute top-3 right-3 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-black/45 text-white/85 opacity-70 backdrop-blur-sm transition-all hover:bg-black/70 hover:opacity-100"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {activa ? (
          <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" strokeLinecap="round" />
        ) : (
          <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
