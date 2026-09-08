"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// La intro solo existe en el navegador y solo baja su código cuando toca.
const IntroVideo = dynamic(() => import("./IntroVideo"), { ssr: false });

/** Evento global que repone la intro (lo dispara "Volver a ver la intro"). */
export const EVENTO_VER_INTRO = "dn:ver-intro";

/**
 * Puerta de la intro sobre la home.
 *
 * Se muestra en cada visita al sitio —con "Omitir" siempre a mano—, pero no en
 * cada navegación interna: verla al volver del reproductor a la traza sería un
 * castigo. La distinción la da sessionStorage: una nueva pestaña o una nueva
 * sesión la reponen, moverse dentro del sitio no.
 *
 * El velo opaco inicial viene renderizado desde el servidor: evita el destello
 * del mapa antes de que el cliente decida si corresponde intro o no.
 */
export default function IntroGate() {
  const [estado, setEstado] = useState<"decidiendo" | "intro" | "nada">("decidiendo");

  useEffect(() => {
    let vista = false;
    try {
      vista = Boolean(sessionStorage.getItem("dn-intro-vista"));
    } catch {}
    setEstado(vista ? "nada" : "intro");
  }, []);

  // "Volver a ver la intro" desde la ficha de obra.
  useEffect(() => {
    const reponer = () => setEstado("intro");
    window.addEventListener(EVENTO_VER_INTRO, reponer);
    return () => window.removeEventListener(EVENTO_VER_INTRO, reponer);
  }, []);

  if (estado === "nada") return null;

  if (estado === "decidiendo") {
    return <div className="fixed inset-0 z-[100] bg-abyss" aria-hidden="true" />;
  }

  return (
    <IntroVideo
      onFin={() => {
        setEstado("nada");
        // El mapa escucha este evento para arrancar su coreografía de
        // bienvenida justo cuando la intro termina de fundirse.
        window.dispatchEvent(new CustomEvent("dn:intro-fin"));
      }}
    />
  );
}
