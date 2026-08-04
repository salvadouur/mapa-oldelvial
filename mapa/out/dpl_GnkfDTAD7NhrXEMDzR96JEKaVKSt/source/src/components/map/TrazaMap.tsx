"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// maplibre-gl 6 ya no expone un default export: todo se importa con nombre.
import { MapLibreMap, Marker, type GeoJSONSource, type LngLatBoundsLike } from "maplibre-gl";
import "./setup";
import { useRouter } from "next/navigation";
import { ARGENTINA_BOUNDS, ESTACIONES, ZOOM_MAX, ZOOM_MIN } from "@/data/traza";
import type { MappedContent } from "@/lib/types";
import { ALTO_CAJON_MAX, ALTO_CAJON_RELATIVO } from "@/components/rail/medidas";
import { ATRIBUCION, buildStyle } from "./mapStyle";
import MapHoverCard from "./MapHoverCard";
import GrillaSatelital from "./GrillaSatelital";

interface Props {
  contenidos: MappedContent[];
  /** Vértices de la traza, [lng, lat]. */
  traza: [number, number][];
  /** Alto en px que ocupa el carrusel. Por defecto, el del cajón contraído. */
  paddingInferior?: number;
}

/** Zoom a partir del cual se muestran los rótulos de las estaciones. */
const ZOOM_ROTULOS = 6;

/**
 * Zoom a partir del cual cada especial muestra su título junto al radar. Más
 * arriba que el de las estaciones: acá ya hay distancia suficiente entre puntos
 * como para que dos rótulos no se pisen.
 */
const ZOOM_TITULOS = 7.2;

export default function TrazaMap({ contenidos, traza, paddingInferior }: Props) {
  const router = useRouter();
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapLibreMap | null>(null);
  const marcadores = useRef<Marker[]>([]);

  const [listo, setListo] = useState(false);
  // Única capa base: se sacó el selector Satélite/Trazado a pedido, así que
  // esto queda fijo en vez de ser estado.
  const basemap = "satelite" as const;
  const [activo, setActivo] = useState<MappedContent | null>(null);
  const [posicion, setPosicion] = useState<{ x: number; y: number } | null>(null);
  /** Se vuelve `true` al primer gesto sobre el mapa: apaga la invitación. */
  const [huboInteraccion, setHuboInteraccion] = useState(false);

  // El hover no debe cerrarse al cruzar el hueco entre el punto y la tarjeta.
  const cierreDiferido = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelarCierre = useCallback(() => {
    if (cierreDiferido.current) {
      clearTimeout(cierreDiferido.current);
      cierreDiferido.current = null;
    }
  }, []);

  const cerrarTarjeta = useCallback(() => {
    cancelarCierre();
    cierreDiferido.current = setTimeout(() => {
      setActivo(null);
      setPosicion(null);
    }, 140);
  }, [cancelarCierre]);

  const proyectar = useCallback((c: MappedContent) => {
    const m = mapa.current;
    if (!m) return null;
    const p = m.project([c.lng, c.lat]);
    return { x: p.x, y: p.y };
  }, []);

  const abrirTarjeta = useCallback(
    (c: MappedContent) => {
      cancelarCierre();
      setActivo(c);
      setPosicion(proyectar(c));
    },
    [cancelarCierre, proyectar],
  );

  /* ---------------- Creación del mapa ---------------- */

  useEffect(() => {
    if (!contenedor.current || mapa.current) return;

    const m = new MapLibreMap({
      container: contenedor.current,
      style: buildStyle("satelite"),
      bounds: boundsDeTraza(traza),
      fitBoundsOptions: { padding: encuadrePadding(paddingInferior) },
      minZoom: ZOOM_MIN,
      maxZoom: ZOOM_MAX,
      maxBounds: [
        [ARGENTINA_BOUNDS[0], ARGENTINA_BOUNDS[1]],
        [ARGENTINA_BOUNDS[2], ARGENTINA_BOUNDS[3]],
      ] as LngLatBoundsLike,
      // La atribución la rendereamos nosotros dentro del panel de referencias:
      // el control propio de MapLibre vive abajo, donde el cajón de contenidos
      // lo taparía por completo.
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: true,
      // El scroll del carrusel no debe secuestrar el zoom del mapa y viceversa.
      cooperativeGestures: false,
    });

    m.touchZoomRotate.disableRotation();
    mapa.current = m;

    m.on("load", () => {
      setListo(true);
      // El fitBounds del constructor prioriza mostrar la traza entera, pero
      // en una traza larga eso deja el zoom por debajo de donde se leen los
      // rótulos. Ya asentada la cámara inicial, si hace falta se acerca un
      // poco más —como una animación corta, no como un salto.
      asegurarZoomLegible(m);
    });

    // Solo cuentan los gestos del usuario: `fitBounds` inicial también dispara
    // `movestart`, y no debería apagar la invitación antes de que la vea.
    const alInteractuar = (ev: { originalEvent?: unknown }) => {
      if (ev.originalEvent) setHuboInteraccion(true);
    };
    m.on("dragstart", alInteractuar);
    m.on("zoomstart", alInteractuar);
    // Handle de depuración: en la consola, `__mapa.getStyle().layers` o
    // `__mapa.isSourceLoaded('traza')` resuelven la mayoría de los problemas
    // del mapa, que suelen ser silenciosos.
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __mapa?: MapLibreMap }).__mapa = m;
    }

    return () => {
      m.remove();
      mapa.current = null;
      setListo(false);
    };
    // Se monta una sola vez: la traza y el padding se aplican en efectos aparte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- Traza ---------------- */

  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo) return;

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: traza },
    };

    if (m.getSource("traza")) {
      (m.getSource("traza") as GeoJSONSource).setData(geojson);
      return;
    }

    m.addSource("traza", { type: "geojson", data: geojson });

    // Halo: da la sensación de que la línea emite luz sobre el terreno.
    m.addLayer({
      id: "traza-halo",
      type: "line",
      source: "traza",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#4ecdf5",
        "line-opacity": 0.22,
        "line-blur": 6,
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 6, 10, 18, 14, 34],
      },
    });

    m.addLayer({
      id: "traza-linea",
      type: "line",
      source: "traza",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#7fe3ff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.4, 10, 3.2, 14, 5],
      },
    });

    // Guiones que avanzan: sugieren dirección y caudal sin ser un elemento más.
    m.addLayer({
      id: "traza-flujo",
      type: "line",
      source: "traza",
      layout: { "line-cap": "butt", "line-join": "round" },
      paint: {
        "line-color": "#eaf9ff",
        "line-opacity": 0.85,
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.4, 10, 3.2, 14, 5],
        "line-dasharray": [0, 4, 3],
      },
    });
  }, [listo, traza]);

  /* ---------------- Animación del flujo ---------------- */

  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Secuencia clásica de dasharray: no existe dash-offset animable, así que
    // se cicla el patrón para simular desplazamiento.
    const secuencia = [
      [0, 4, 3],
      [0.5, 4, 2.5],
      [1, 4, 2],
      [1.5, 4, 1.5],
      [2, 4, 1],
      [2.5, 4, 0.5],
      [3, 4, 0],
      [0, 0.5, 3, 3.5],
      [0, 1, 3, 3],
      [0, 1.5, 3, 2.5],
      [0, 2, 3, 2],
      [0, 2.5, 3, 1.5],
      [0, 3, 3, 1],
    ];

    let i = 0;
    const id = setInterval(() => {
      if (!m.getLayer("traza-flujo")) return;
      i = (i + 1) % secuencia.length;
      m.setPaintProperty("traza-flujo", "line-dasharray", secuencia[i]);
    }, 90);

    return () => clearInterval(id);
  }, [listo]);

  /* ---------------- Marcadores ---------------- */

  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo) return;

    for (const mk of marcadores.current) mk.remove();
    marcadores.current = [];

    // Estaciones de bombeo: siempre visibles, son el esqueleto de la traza.
    for (const e of ESTACIONES) {
      const el = document.createElement("div");
      el.className = "pointer-events-none flex flex-col items-center gap-1.5 select-none";
      el.innerHTML = `
        <span class="block h-2 w-2 rotate-45 border border-cyan/70 bg-abyss/60"></span>
        <span class="js-rotulo flex flex-col items-center gap-0.5 transition-opacity duration-200">
          <span class="label-tech whitespace-nowrap text-[9px] text-ink md:text-[10px]">${e.nombre}</span>
          <span class="label-tech hidden whitespace-nowrap text-[9px] text-ink-faint md:block">${e.detalle}</span>
        </span>`;
      const marcador = new Marker({ element: el, anchor: "top" })
        .setLngLat([e.lng, e.lat])
        .addTo(m);

      // MapLibre rotula todo marcador como "Map marker" y lo hace enfocable.
      // Las estaciones son decorativas —su nombre ya está en el DOM como
      // texto—, así que se sacan del recorrido con teclado.
      el.setAttribute("aria-hidden", "true");
      el.removeAttribute("role");
      el.tabIndex = -1;

      marcadores.current.push(marcador);
    }

    // Especiales: marca de radar. Círculo con borde e interior transparente,
    // más dos aros desfasados que se expanden.
    for (const c of contenidos) {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `Abrir ${c.title}`);
      el.className =
        "group relative flex cursor-pointer flex-col items-center border-0 bg-transparent p-0";
      el.innerHTML = `
        <span class="relative grid h-12 w-12 place-items-center">
          <span class="absolute h-5 w-5 rounded-full border border-cyan/85" style="animation: radar 3.2s cubic-bezier(0.22,1,0.36,1) infinite"></span>
          <span class="absolute h-5 w-5 rounded-full border border-cyan/65" style="animation: radar 3.2s cubic-bezier(0.22,1,0.36,1) 1.6s infinite"></span>
          <span class="relative h-5 w-5 rounded-full border-[1.5px] border-cyan bg-cyan/60 shadow-[0_0_16px_rgba(78,205,245,0.75)] transition-transform duration-200 group-hover:scale-125"></span>
        </span>
        <span class="js-titulo -mt-1 rounded bg-abyss/75 px-1.5 py-0.5 opacity-0 backdrop-blur transition-opacity duration-200">
          <span class="label-tech whitespace-nowrap text-[9px] text-cyan">${c.title}</span>
        </span>`;

      el.addEventListener("mouseenter", () => abrirTarjeta(c));
      el.addEventListener("mouseleave", cerrarTarjeta);
      el.addEventListener("focus", () => abrirTarjeta(c));
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        // En touch el primer toque abre la ficha flotante; la navegación se
        // hace desde el botón de la tarjeta.
        if (window.matchMedia("(hover: hover)").matches) router.push(`/contenido/${c.slug}`);
        else abrirTarjeta(c);
      });

      marcadores.current.push(
        new Marker({ element: el, anchor: "center" })
          .setLngLat([c.lng, c.lat])
          .addTo(m),
      );
    }

    return () => {
      for (const mk of marcadores.current) mk.remove();
      marcadores.current = [];
    };
  }, [listo, contenidos, abrirTarjeta, cerrarTarjeta, router]);

  /* ---------------- Reproyección, rótulos y anti-colisión ---------------- */

  useEffect(() => {
    const m = mapa.current;
    if (!m || !listo) return;

    // "move" cubre pan, zoom y rotate: alcanza con un solo listener para
    // reproyectar la tarjeta activa y resolver qué rótulos entran.
    const actualizar = () => {
      if (activo) setPosicion(proyectar(activo));

      const zoom = m.getZoom();
      const mostrarRotulos = zoom >= ZOOM_ROTULOS;
      const mostrarTitulos = zoom >= ZOOM_TITULOS;

      const rotulos = [...document.querySelectorAll<HTMLElement>(".js-rotulo")];
      const titulos = [...document.querySelectorAll<HTMLElement>(".js-titulo")];

      for (const el of rotulos) el.style.opacity = mostrarRotulos ? "1" : "0";
      for (const el of titulos) el.style.opacity = mostrarTitulos ? "1" : "0";
      if (!mostrarRotulos && !mostrarTitulos) return;

      // Anti-colisión en espacio de pantalla: dos puntos cercanos pueden
      // terminar con los rótulos pisándose. Las estaciones tienen prioridad
      // —son el esqueleto fijo de la traza—; un título de especial que se
      // pisa con algo ya aceptado se oculta. El punto en sí sigue ahí y
      // sigue siendo clickeable, solo se pierde el texto redundante.
      const aceptados: DOMRect[] = [];
      const candidatos = [
        ...(mostrarRotulos ? rotulos : []),
        ...(mostrarTitulos ? titulos : []),
      ];
      for (const el of candidatos) {
        const rect = el.getBoundingClientRect();
        if (aceptados.some((r) => seSuperponen(rect, r))) {
          el.style.opacity = "0";
        } else {
          aceptados.push(rect);
        }
      }
    };

    m.on("move", actualizar);
    actualizar();

    return () => {
      m.off("move", actualizar);
    };
  }, [listo, activo, proyectar]);

  /* ---------------- Controles ---------------- */

  const encuadrar = useCallback(() => {
    const m = mapa.current;
    if (!m) return;
    m.fitBounds(boundsDeTraza(traza), {
      padding: encuadrePadding(paddingInferior),
      duration: 900,
    });
    m.once("moveend", () => asegurarZoomLegible(m));
  }, [traza, paddingInferior]);

  return (
    <div className="absolute inset-0">
      <div ref={contenedor} className="h-full w-full" />

      <GrillaSatelital />

      {activo && posicion && (
        <MapHoverCard
          contenido={activo}
          x={posicion.x}
          y={posicion.y}
          onMouseEnter={cancelarCierre}
          onMouseLeave={cerrarTarjeta}
          onCerrar={() => {
            cancelarCierre();
            setActivo(null);
          }}
        />
      )}

      {/* Las cifras de la obra ahora viven en el header (arriba de todo, fuera
          de este componente); acá solo quedan los controles del propio mapa.
          Van todos en la banda superior: abajo está el cajón de contenidos,
          que ocupa hasta el 80% de la pantalla al expandirse. */}
      <div className="absolute top-32 right-3 z-20 flex flex-col items-end gap-1.5 md:right-6">
        <BotonCentrarMapa onClick={encuadrar} />
        <Referencias />
      </div>

      <LlamadaAlMapa contenidos={contenidos.length} visible={!huboInteraccion && !activo} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Invitación a explorar el mapa.
 *
 * Sin esto los radares se leen como decoración: hay que decir explícitamente
 * que son contenido y que se abren. Desaparece en cuanto el usuario mueve el
 * mapa o toca un punto —ya entendió— para no dejar un cartel permanente.
 */
function LlamadaAlMapa({ contenidos, visible }: { contenidos: number; visible: boolean }) {
  if (contenidos === 0) return null;

  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none absolute inset-x-0 z-20 flex justify-center transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
      style={{ bottom: `calc(min(${ALTO_CAJON_RELATIVO * 100}dvh, ${ALTO_CAJON_MAX}px) + 18px)` }}
    >
      <p className="panel flex items-center gap-2.5 px-4 py-2.5">
        <span className="relative grid h-4 w-4 shrink-0 place-items-center">
          <span
            className="absolute h-3 w-3 rounded-full border border-cyan/80"
            style={{ animation: "radar 3.2s cubic-bezier(0.22,1,0.36,1) infinite" }}
          />
          <span className="relative h-3 w-3 rounded-full border border-cyan bg-cyan/60" />
        </span>
        <span className="text-[13px] leading-snug text-ink">
          Navegá el mapa y encontrá los contenidos
        </span>
        <span className="label-tech hidden text-cyan sm:block">{contenidos} especiales</span>
      </p>
    </div>
  );
}

/**
 * Recentra el mapa sobre la traza completa.
 *
 * Antes vivía como un link de texto en el footer de `PanelObra`, que en móvil
 * arranca colapsado: el control quedaba inalcanzable hasta desplegar la
 * tarjeta. Como ícono fijo sobre el mapa está siempre a mano, sin depender del
 * estado de ningún otro panel.
 */
function BotonCentrarMapa({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Encuadrar la traza completa"
      aria-label="Encuadrar la traza completa"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-abyss/70 text-ink-faint backdrop-blur transition-colors hover:border-cyan/50 hover:text-cyan"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M1.5 5V2.5A1 1 0 0 1 2.5 1.5H5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 1.5h2.5a1 1 0 0 1 1 1V5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 11v2.5a1 1 0 0 1-1 1H11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 14.5H2.5a1 1 0 0 1-1-1V11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/**
 * Referencias del mapa y atribución de las teselas.
 *
 * La atribución está detrás de un botón en vez de impresa sobre el mapa: no
 * puede sacarse del todo —Esri y OpenStreetMap la exigen para usar las teselas
 * sin API key— pero sí puede dejar de ocupar la pantalla.
 */
function Referencias() {
  const [creditos, setCreditos] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="panel hidden px-4 py-3 lg:block">
        <p className="label-tech mb-2.5 text-ink-faint">Referencias</p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2.5">
            <span className="h-px w-6 bg-[#7fe3ff]" />
            <span className="label-tech text-[10px] text-ink-soft">
              Traza Programa Duplicar Norte
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="ml-2 block h-2 w-2 rotate-45 border border-cyan/80 bg-abyss" />
            <span className="label-tech text-[10px] text-ink-soft">Estación de bombeo</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="ml-1.5 block h-3 w-3 rounded-full border border-cyan bg-cyan/60" />
            <span className="label-tech text-[10px] text-ink-soft">Contenido especial</span>
          </li>
        </ul>
      </div>

      {creditos && (
        <p className="panel label-tech max-w-[210px] px-3 py-2 text-[9px] leading-relaxed text-ink-soft">
          {ATRIBUCION.satelite}
        </p>
      )}

      <button
        type="button"
        onClick={() => setCreditos((v) => !v)}
        aria-expanded={creditos}
        aria-label="Créditos de la cartografía"
        title="Créditos de la cartografía"
        className={`grid h-7 w-7 place-items-center rounded-full border border-line bg-abyss/70 text-[11px] backdrop-blur transition-colors hover:border-cyan/50 hover:text-cyan ${
          creditos ? "text-cyan" : "text-ink-faint"
        }`}
      >
        i
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Si dos rects de rótulos se superponen en pantalla, con un margen chico. */
function seSuperponen(a: DOMRect, b: DOMRect, margen = 4): boolean {
  return !(
    a.right + margen < b.left ||
    a.left - margen > b.right ||
    a.bottom + margen < b.top ||
    a.top - margen > b.bottom
  );
}

/**
 * Zoom mínimo al encuadrar. Por debajo de `ZOOM_ROTULOS` los nombres de las
 * estaciones no se leen, y en una traza tan larga el ajuste "que entre todo"
 * puede quedar bastante por debajo. Se prioriza la legibilidad: el encuadre
 * puede no mostrar la traza de punta a punta, y hay que panear para verla
 * completa.
 */
const ZOOM_MINIMO_ENCUADRE = 7;

/**
 * Si el fitBounds recién aplicado dejó el zoom por debajo del mínimo legible,
 * acerca sin mover el centro. Deliberadamente no usa `cameraForBounds` para
 * calcular esto de antemano: en la práctica resultó poco confiable apenas
 * termina de cargar el estilo. Corregir después de que la cámara ya se movió
 * es más simple y no depende de ese cálculo.
 */
function asegurarZoomLegible(m: MapLibreMap) {
  if (m.getZoom() < ZOOM_MINIMO_ENCUADRE) {
    m.easeTo({ zoom: ZOOM_MINIMO_ENCUADRE, duration: 500 });
  }
}

function boundsDeTraza(coords: [number, number][]): LngLatBoundsLike {
  let oeste = 180;
  let este = -180;
  let sur = 90;
  let norte = -90;
  for (const [lng, lat] of coords) {
    oeste = Math.min(oeste, lng);
    este = Math.max(este, lng);
    sur = Math.min(sur, lat);
    norte = Math.max(norte, lat);
  }
  // Un poco más cerca que el margen por defecto: la traza llena más pantalla.
  const margen = 0.14;
  return [
    [oeste - margen, sur - margen],
    [este + margen, norte + margen],
  ];
}

/**
 * Márgenes del encuadre. Cada uno descuenta lo que hay encima del mapa en ese
 * lado: si no, la traza queda debajo de un panel y el usuario no la ve entera.
 */
function encuadrePadding(inferior?: number) {
  const angosto = typeof window !== "undefined" && window.innerWidth < 768;
  const alto = typeof window !== "undefined" ? window.innerHeight : 800;

  // Alto del cajón contraído, con la misma fórmula que usa ContentDrawer, más
  // el espacio de la invitación que flota justo encima.
  const cajon = Math.min(alto * ALTO_CAJON_RELATIVO, ALTO_CAJON_MAX) + 24;
  // Alto real de la invitación más su separación del cajón. En pantallas
  // angostas el texto ocupa toda la línea y la píldora crece, así que sin este
  // margen el último rótulo de la traza queda detrás.
  const invitacion = angosto ? 68 : 48;

  return {
    // El header ahora incluye la fila de cifras de la obra, así que es más
    // alto que antes: hay que dejar más aire arriba para que la traza no
    // quede tapada por él ni por los rótulos de las estaciones.
    top: angosto ? 140 : 120,
    bottom: inferior ?? cajon + invitacion,
    // Ya no hay ficha a la izquierda (se fue al header): solo el margen justo
    // para que el punto más al oeste no quede pegado al borde.
    left: angosto ? 72 : 96,
    right: angosto ? 72 : 264,
  };
}
