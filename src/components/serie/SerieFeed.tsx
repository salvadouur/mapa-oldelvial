"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Player from "@vimeo/player";
import Cover from "@/components/Cover";
import { formatDuracion } from "@/lib/format";
import { vimeoEmbedUrl } from "@/lib/vimeo";
import { especialRelacionado } from "@/lib/content/sugerencias";
import type { Content } from "@/lib/types";

interface Props {
  simples: Content[];
  especiales: Content[];
  slugInicial: string;
}

/** Cuántas vueltas a la playlist se montan de entrada. */
const CICLOS_INICIALES = 2;

/**
 * Tope de slides en el DOM. Con 9 simples son 13 vueltas: nadie llega, pero el
 * feed no puede crecer sin límite.
 */
const MAX_SLIDES = 120;

/** A cuántos slides del final se agrega la vuelta siguiente. */
const MARGEN_PRECARGA = 3;

/**
 * Playlist de scroll infinito de los contenidos simples.
 *
 * Cada video ocupa una pantalla y el scroll engancha de a uno. Al terminar un
 * video, el feed baja solo al siguiente. La lista se cicla: cuando el usuario
 * se acerca al final se agrega otra vuelta, así el scroll nunca se corta.
 *
 * Solo el slide activo monta el iframe de Vimeo; el resto muestra la miniatura.
 * Es lo que permite tener decenas de slides sin que la página se arrastre.
 */
export default function SerieFeed({ simples, especiales, slugInicial }: Props) {
  // El feed arranca en el video pedido por la URL y sigue en orden desde ahí.
  const orden = useMemo(() => {
    const i = Math.max(
      0,
      simples.findIndex((s) => s.slug === slugInicial),
    );
    return [...simples.slice(i), ...simples.slice(0, i)];
  }, [simples, slugInicial]);

  const [ciclos, setCiclos] = useState(CICLOS_INICIALES);
  const slides = useMemo(
    () => Array.from({ length: ciclos }, () => orden).flat(),
    [orden, ciclos],
  );

  const [activo, setActivo] = useState(0);
  const [huboGesto, setHuboGesto] = useState(false);
  const [progreso, setProgreso] = useState(0);

  const contenedor = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const iframe = useRef<HTMLIFrameElement>(null);

  const irA = useCallback((indice: number) => {
    slideRefs.current[indice]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /**
   * Salta al video elegido en la playlist. Busca la próxima aparición hacia
   * adelante —el feed cicla, así que el mismo video aparece varias veces— para
   * que elegir de la lista siempre sea avanzar y no retroceder.
   */
  const irASlug = useCallback(
    (slug: string) => {
      const adelante = slides.findIndex((s, i) => i > activo && s.slug === slug);
      const destino = adelante !== -1 ? adelante : slides.findIndex((s) => s.slug === slug);
      if (destino !== -1) irA(destino);
    },
    [slides, activo, irA],
  );

  /* ---------------- Qué slide está en pantalla ---------------- */

  useEffect(() => {
    const raiz = contenedor.current;
    if (!raiz) return;

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.indice);
          if (!Number.isNaN(i)) setActivo(i);
        }
      },
      { root: raiz, threshold: 0.6 },
    );

    for (const el of slideRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [slides.length]);

  /* ---------------- Crecimiento del feed ---------------- */

  useEffect(() => {
    if (slides.length >= MAX_SLIDES) return;
    if (activo >= slides.length - MARGEN_PRECARGA) setCiclos((c) => c + 1);
  }, [activo, slides.length]);

  /* ---------------- Reproductor del slide activo ---------------- */

  useEffect(() => {
    setProgreso(0);
    if (!huboGesto || !iframe.current) return;

    const p = new Player(iframe.current);
    p.on("timeupdate", ({ percent }) => setProgreso(percent));
    p.on("ended", () => irA(activo + 1));

    return () => {
      p.off("timeupdate");
      p.off("ended");
      p.unload().catch(() => {});
    };
  }, [activo, huboGesto, irA]);

  /* ---------------- URL y teclado ---------------- */

  useEffect(() => {
    const actual = slides[activo];
    if (actual) window.history.replaceState(null, "", `/serie/${actual.slug}`);
  }, [activo, slides]);

  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        irA(activo + 1);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        irA(activo - 1);
      }
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [activo, irA]);

  return (
    <div
      ref={contenedor}
      className="no-scrollbar flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain"
    >
      {slides.map((c, i) => (
        <Slide
          key={`${c.slug}-${i}`}
          ref={(el) => {
            slideRefs.current[i] = el;
          }}
          indice={i}
          contenido={c}
          posicionEnSerie={simples.findIndex((s) => s.id === c.id) + 1}
          totalEnSerie={simples.length}
          activo={i === activo}
          reproduciendo={i === activo && huboGesto}
          progreso={i === activo ? progreso : 0}
          iframeRef={i === activo ? iframe : undefined}
          onReproducir={() => setHuboGesto(true)}
          onSiguiente={() => irA(i + 1)}
          simples={simples}
          onElegir={irASlug}
          especial={especialRelacionado(c, especiales)}
          primero={i === 0}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface SlideProps {
  ref: React.Ref<HTMLElement>;
  indice: number;
  contenido: Content;
  posicionEnSerie: number;
  totalEnSerie: number;
  activo: boolean;
  reproduciendo: boolean;
  progreso: number;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  onReproducir: () => void;
  onSiguiente: () => void;
  simples: Content[];
  onElegir: (slug: string) => void;
  especial: Content | null;
  primero: boolean;
}

function Slide({
  ref,
  indice,
  contenido,
  posicionEnSerie,
  totalEnSerie,
  activo,
  reproduciendo,
  progreso,
  iframeRef,
  onReproducir,
  onSiguiente,
  simples,
  onElegir,
  especial,
  primero,
}: SlideProps) {
  return (
    <section
      ref={ref}
      data-indice={indice}
      className="flex h-full snap-start snap-always items-center px-4 py-4 md:px-8 md:py-5"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_296px] lg:items-center lg:gap-10">
        <div className="min-w-0">
          {/* El slide tiene que entrar en una pantalla: se limita el alto del
              reproductor y el ancho lo sigue por la relación 16:9, en vez de
              dejar que el video empuje el resto fuera del viewport. */}
          <div className="relative mx-auto aspect-video max-h-[42dvh] w-full max-w-[calc(42dvh*16/9)] overflow-hidden rounded-xl border border-line bg-black md:max-h-[46dvh] md:max-w-[calc(46dvh*16/9)] lg:max-h-[58dvh] lg:max-w-[calc(58dvh*16/9)]">
            {reproduciendo && contenido.vimeoId ? (
              <iframe
                ref={iframeRef}
                src={vimeoEmbedUrl(contenido.vimeoId, { autoplay: true })}
                title={contenido.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <button
                type="button"
                onClick={onReproducir}
                className="group absolute inset-0"
                aria-label={`Reproducir ${contenido.title}`}
                tabIndex={activo ? 0 : -1}
              >
                <Cover slug={contenido.slug} url={contenido.coverUrl} alt="" />
                <span className="absolute inset-0 bg-abyss/30" />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/15 backdrop-blur transition-transform group-hover:scale-110">
                    <svg viewBox="0 0 16 16" className="ml-1 h-6 w-6 fill-white">
                      <path d="M4 2.5v11l9.5-5.5z" />
                    </svg>
                  </span>
                </span>
              </button>
            )}
          </div>

          <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-cyan transition-[width] duration-300"
              style={{ width: `${Math.round(progreso * 100)}%` }}
            />
          </div>

          <div className="mt-4 flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="label-tech mb-1.5 text-cyan">
                {String(posicionEnSerie).padStart(2, "0")} /{" "}
                {String(totalEnSerie).padStart(2, "0")}
                {contenido.locationName ? ` · ${contenido.locationName}` : ""}
                {contenido.durationSeconds
                  ? ` · ${formatDuracion(contenido.durationSeconds)}`
                  : ""}
              </p>
              <h2 className="text-2xl leading-tight font-semibold tracking-tight text-balance text-ink md:text-3xl">
                {contenido.title}
              </h2>
              {contenido.summary && (
                <p className="mt-2 line-clamp-2 max-w-xl text-[14px] leading-relaxed text-ink-soft">
                  {contenido.summary}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onSiguiente}
              aria-label="Siguiente video"
              title="Siguiente video"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-cyan/50 hover:text-cyan"
              tabIndex={activo ? 0 : -1}
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {primero && !reproduciendo && (
            <p className="label-tech mt-4 hidden text-[9px] text-ink-faint lg:block">
              Deslizá o usá ↓ para seguir
            </p>
          )}
        </div>

        <Playlist
          simples={simples}
          actual={contenido}
          onElegir={onElegir}
          especial={especial}
          activo={activo}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Playlist de la serie, al costado del video.
 *
 * En pantallas grandes está la lista completa en orden de proceso constructivo,
 * con el actual marcado: sirve para ubicarse y para saltar. En pantallas chicas
 * no entra, así que se muestran solo los dos que siguen —el slide tiene que
 * caber en una pantalla, sin scroll interno.
 */
function Playlist({
  simples,
  actual,
  onElegir,
  especial,
  activo,
}: {
  simples: Content[];
  actual: Content;
  onElegir: (slug: string) => void;
  especial: Content | null;
  activo: boolean;
}) {
  const i = simples.findIndex((s) => s.id === actual.id);
  const proximos = [...simples.slice(i + 1), ...simples.slice(0, i)];

  return (
    // El alto acotado es lo que le permite scrollear a la lista de escritorio.
    <aside className="flex min-w-0 flex-col lg:max-h-[64dvh]">
      {/* Móvil y tablet: lo que viene */}
      <div className="lg:hidden">
        <p className="label-tech mb-2.5 text-ink-faint">A continuación</p>
        <ul className="space-y-1.5">
          {proximos.slice(0, 2).map((s) => (
            <li key={s.id}>
              <ItemPlaylist contenido={s} onElegir={onElegir} activo={activo} />
            </li>
          ))}
        </ul>
      </div>

      {/* Escritorio: la playlist entera, con el actual resaltado */}
      <div className="hidden min-h-0 flex-col lg:flex">
        <p className="label-tech mb-2.5 shrink-0 text-ink-faint">
          Serie · un minuto de ingeniería
        </p>
        <ol className="no-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {simples.map((s, n) => (
            <li key={s.id}>
              <ItemPlaylist
                contenido={s}
                numero={n + 1}
                esActual={s.id === actual.id}
                onElegir={onElegir}
                activo={activo}
              />
            </li>
          ))}
        </ol>
      </div>

      {/* El puente al otro tipo de contenido: del video de un minuto a la ficha
          georreferenciada que cuenta la misma etapa en detalle. */}
      {especial && (
        <Link
          href={`/contenido/${especial.slug}`}
          tabIndex={activo ? 0 : -1}
          className="mt-3 shrink-0 rounded-lg border border-cyan/25 bg-cyan/[0.07] p-3 transition-colors hover:border-cyan/50"
        >
          <span className="label-tech block text-cyan">Especial en el mapa</span>
          <span className="mt-1 block text-[13px] leading-snug font-medium text-ink">
            {especial.title}
          </span>
          {especial.locationName && (
            <span className="label-tech mt-1 block text-[9px] text-ink-faint">
              {especial.locationName}
              {especial.kp ? ` · ${especial.kp}` : ""}
            </span>
          )}
        </Link>
      )}
    </aside>
  );
}

function ItemPlaylist({
  contenido,
  numero,
  esActual = false,
  onElegir,
  activo,
}: {
  contenido: Content;
  numero?: number;
  esActual?: boolean;
  onElegir: (slug: string) => void;
  activo: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onElegir(contenido.slug)}
      aria-current={esActual ? "true" : undefined}
      tabIndex={activo ? 0 : -1}
      className={`flex w-full items-center gap-2.5 rounded-lg border p-1.5 text-left transition-colors ${
        esActual
          ? "border-cyan/30 bg-cyan/10"
          : "border-transparent hover:border-line hover:bg-white/[0.03]"
      }`}
    >
      {numero !== undefined && (
        <span
          className={`label-tech w-4 shrink-0 text-center text-[9px] ${
            esActual ? "text-cyan" : "text-ink-faint"
          }`}
        >
          {String(numero).padStart(2, "0")}
        </span>
      )}
      <span className="relative h-10 w-[68px] shrink-0 overflow-hidden rounded border border-line">
        <Cover slug={contenido.slug} url={contenido.coverUrl} alt="" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[12.5px] font-medium ${
            esActual ? "text-cyan" : "text-ink"
          }`}
        >
          {contenido.title}
        </span>
        <span className="label-tech mt-0.5 block text-[9px] text-ink-faint">
          {formatDuracion(contenido.durationSeconds)}
          {contenido.locationName ? ` · ${contenido.locationName}` : ""}
        </span>
      </span>
    </button>
  );
}
