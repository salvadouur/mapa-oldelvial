import type { Content, Rail } from "@/lib/types";
import { formatearProgresiva } from "@/data/traza";

/**
 * Contenido de demostración.
 *
 * Se usa cuando no hay Supabase configurado. Los `vimeoId` **son reales** —los
 * videos de obra, no listados, con su hash de privacidad—, así que las
 * miniaturas y las duraciones las resuelve `completarDesdeVimeo()` desde el
 * propio Vimeo: no hay portadas hardcodeadas.
 *
 * Los textos, en cambio, son borradores para reemplazar desde el backoffice.
 *
 * Nota sobre los puntos del mapa: **no** coinciden con las estaciones de
 * bombeo. Un contenido se ancla donde pasó la cosa que muestra, que casi nunca
 * es exactamente una EB; las estaciones son la referencia fija de la traza y se
 * dibujan aparte.
 */

/* ------------------------------------------------------------------ */
/* Videos                                                              */
/* ------------------------------------------------------------------ */

const VIDEO = {
  acopio: "1214383072/293ded4d3b",
  soldadura: "1214081693/7643f2c348",
  tocoAToco: "1213634536/c812f2449a",
  curvado: "1213349389/2fd8bef934",
  desfile: "1213343224/8be6d8152b",
  zanjeo: "1213332166/ebdf8fd524",
  topografia: "1212437523/51a369fbc8",
  geodeteccion: "1211886800/87476bc641",
  dobleJunta: "1211839891/6854d7fd48",
  avancesDeObra: "1182076624/6b9cc4eb7b",
} as const;

/** Modelo 3D de la unidad de medición, publicado por Tronadores en Sketchfab. */
const SKETCHFAB_UAM = "acc1c5fbf4d64e8e8b9fcd89d72dbdc8";

/* ------------------------------------------------------------------ */
/* Publicaciones ancladas al mapa                                      */
/* ------------------------------------------------------------------ */

interface DatosComplejo {
  slug: string;
  title: string;
  subtitle?: string;
  summary: string;
  vimeoId?: string;
  locationName: string;
  /** Punto propio sobre la traza, elegido por contenido. */
  punto: [number, number];
  tags: string[];
  orderIndex: number;
  publishedAt: string;
  blocks: Content["blocks"];
}

function complejo(d: DatosComplejo): Content {
  const [lng, lat] = d.punto;
  return {
    id: d.slug,
    slug: d.slug,
    type: "especial",
    status: "published",
    title: d.title,
    subtitle: d.subtitle ?? null,
    summary: d.summary,
    coverUrl: null, // la resuelve Vimeo
    vimeoId: d.vimeoId ?? null,
    durationSeconds: null, // la resuelve Vimeo
    locationName: d.locationName,
    // La progresiva se calcula sobre la traza dibujada, así que se corrige sola
    // cuando se reemplaza la geometría por la del KMZ oficial.
    kp: formatearProgresiva([lng, lat]),
    lat,
    lng,
    tags: d.tags,
    orderIndex: d.orderIndex,
    publishedAt: d.publishedAt,
    blocks: d.blocks,
  };
}

export const SEED_COMPLEJOS: Content[] = [
  complejo({
    slug: "avances-de-obra-auca-mahuida",
    title: "Avances de obra",
    subtitle: "Recorrido general por el frente de Auca Mahuida",
    summary:
      "Panorama del avance sobre el tramo norte: apertura de pista, acopio y los frentes de soldadura trabajando en paralelo.",
    vimeoId: VIDEO.avancesDeObra,
    locationName: "Auca Mahuida",
    punto: [-68.8, -37.772],
    tags: ["avance de obra", "drone"],
    orderIndex: 1,
    publishedAt: "2026-04-22T12:00:00Z",
    blocks: [
      { id: "a1", position: 0, type: "video", data: { vimeoId: VIDEO.avancesDeObra } },
      {
        id: "a2",
        position: 1,
        type: "text",
        data: {
          heading: "Varios frentes a la vez",
          body: "Una obra lineal no avanza como una línea: avanza como varios frentes simultáneos que se persiguen. Mientras la topografía replantea kilómetros adelante, atrás zanjean, más atrás sueldan y todavía más atrás tapan.\n\n**El cuello de botella se mueve.** Un día es el zanjeo por un tramo de roca, otro día es la disponibilidad de tubo en pista. Ese recorrido muestra el estado de todos los frentes en el mismo momento.",
        },
      },
    ],
  }),

  complejo({
    slug: "planta-doble-junta",
    title: "Planta de Doble Junta",
    subtitle: "Acopio 1 · el armado del tubo de 24 m",
    summary:
      "Dos tubos de 12 metros se unen para formar tubos de 24, con arco sumergido y 90% de automatización.",
    vimeoId: VIDEO.dobleJunta,
    locationName: "Acopio 1",
    punto: [-68.63, -37.812],
    tags: ["soldadura", "acopio"],
    orderIndex: 2,
    publishedAt: "2026-04-15T12:00:00Z",
    blocks: [
      {
        id: "b1",
        position: 0,
        type: "video",
        data: { vimeoId: VIDEO.dobleJunta, caption: "Recorrido completo por la planta de doble junta." },
      },
      {
        id: "b2",
        position: 1,
        type: "text",
        data: {
          heading: "Rapidez y calidad en campo",
          body: "La planta fabrica tubos de 24 m uniendo dos de 12 m. El desafío fue armar la estructura en campo, con bases civiles in situ y vinculación de módulos en el lugar.\n\n**Acá lo que gira es el tubo, no la punta soldadora.** Eso, sumado al arco sumergido para el relleno, da una calidad superior a la manual y mayor rapidez. Alineadores internos y externos logran tolerancias milimétricas bajo normas API.\n\nProducimos entre 120 y 130 soldaduras diarias. Para igualar este rendimiento de forma manual, necesitaríamos el doble de personal y equipos.",
        },
      },
      {
        id: "b3",
        position: 2,
        type: "stats",
        data: {
          items: [
            { label: "Automatización", value: "90", unit: "%" },
            { label: "Soldaduras / día", value: "120–130" },
            { label: "Tubo final", value: "24", unit: "m" },
          ],
        },
      },
      {
        id: "b4",
        position: 3,
        type: "steps",
        data: {
          heading: "El armado del tubo de 24 m",
          items: [
            { title: "Biselado", body: "Ingresan los tubos para el biselado inicial." },
            { title: "Pasada raíz", body: "Presentación y primera pasada de soldadura." },
            { title: "Relleno exterior", body: "Relleno de la soldadura trabajando desde el exterior del caño." },
            { title: "Soldadura interna", body: "Se ejecuta la soldadura interna, cerrando la etapa de unión." },
            { title: "Ensayo US", body: "Ultrasonido con brazo robotizado: libera el caño o marca reproceso." },
          ],
        },
      },
      {
        id: "b5",
        position: 4,
        type: "gallery",
        data: { caption: "Registro fotográfico de obra · Acopio 1", images: [] },
      },
    ],
  }),

  complejo({
    slug: "topografia-y-geodeteccion",
    title: "Topografía y geodetección",
    subtitle: "Lo que se hace antes de tocar el suelo",
    summary:
      "El replanteo fija la traza en el terreno y la geodetección busca lo que ya está enterrado. Todo lo demás depende de estas dos tareas.",
    vimeoId: VIDEO.topografia,
    locationName: "Tramo norte",
    punto: [-68.42, -37.848],
    tags: ["topografía", "geodetección", "previas"],
    orderIndex: 3,
    publishedAt: "2026-04-09T12:00:00Z",
    blocks: [
      { id: "c1", position: 0, type: "video", data: { vimeoId: VIDEO.topografia } },
      {
        id: "c2",
        position: 1,
        type: "text",
        data: {
          heading: "Primero saber qué hay abajo",
          body: "El replanteo lleva al terreno lo que estaba en el proyecto: eje, ancho de pista, progresivas y los puntos donde la traza cruza algo.\n\nLa geodetección va después, y busca lo contrario: servicios existentes que no se ven. **Un ducto ajeno mal ubicado es el peor hallazgo posible durante el zanjeo**, y es exactamente lo que esta etapa está para evitar.",
        },
      },
      { id: "c3", position: 2, type: "video", data: { vimeoId: VIDEO.geodeteccion, caption: "Geodetección de servicios enterrados." } },
    ],
  }),

  complejo({
    // El slug es único en toda la base, así que no puede repetir el del simple
    // homónimo: los especiales llevan un slug descriptivo del lugar.
    slug: "zanjeo-crucero-catriel",
    title: "Zanjeo",
    subtitle: "La zanja que define el resto de la obra",
    summary:
      "Profundidad, ancho y talud los decide el suelo. Cada cambio de material obliga a cambiar de equipo y de ritmo.",
    vimeoId: VIDEO.zanjeo,
    locationName: "Crucero Catriel",
    punto: [-67.955, -38.03],
    tags: ["movimiento de suelos"],
    orderIndex: 4,
    publishedAt: "2026-04-02T12:00:00Z",
    blocks: [
      { id: "d1", position: 0, type: "video", data: { vimeoId: VIDEO.zanjeo } },
      {
        id: "d2",
        position: 1,
        type: "text",
        data: {
          body: "La zanja tiene que dar tapada suficiente sobre el caño y, al mismo tiempo, sostenerse abierta el tiempo que haga falta hasta que se baje el tubo. En suelo suelto eso significa abrir el talud; en roca, cambiar la retro por martillo y bajar el avance diario.\n\nEl suelo vegetal se retira aparte y se acopia al costado: vuelve a su lugar en la tapada, y no mezclado con el resto.",
        },
      },
      {
        id: "d3",
        position: 2,
        type: "infographic",
        data: {
          url: "",
          alt: "Sección transversal de la zanja y la pista de trabajo",
          caption: "Sección transversal de la pista. Cargar la infografía desde el backoffice.",
        },
      },
    ],
  }),

  complejo({
    slug: "curvado-y-soldadura",
    title: "Curvado y soldadura",
    subtitle: "La geometría del terreno, tubo por tubo",
    summary:
      "Cada quiebre del terreno se traduce en un ángulo de curvado. Después, la línea regular une tubo con tubo sobre la pista.",
    vimeoId: VIDEO.curvado,
    locationName: "Tramo medio",
    punto: [-68.02, -38.365],
    tags: ["curvado", "soldadura"],
    orderIndex: 5,
    publishedAt: "2026-03-26T12:00:00Z",
    blocks: [
      { id: "e1", position: 0, type: "video", data: { vimeoId: VIDEO.curvado } },
      {
        id: "e2",
        position: 1,
        type: "text",
        data: {
          heading: "Del relevamiento al ángulo",
          body: "El relevamiento topográfico define, para cada tramo, cuánto tiene que doblarse el caño para acompañar el terreno sin comprometer la sección.\n\nLa curvadora trabaja en frío, con mandril interno, en pasadas sucesivas de pocos grados. El control es permanente: **un ángulo de más obliga a descartar el tubo**.",
        },
      },
      {
        id: "e3",
        position: 2,
        type: "stats",
        data: {
          items: [
            { label: "Diámetro", value: "24", unit: "″" },
            { label: "Pasadas por curva", value: "6–9" },
            { label: "Tolerancia", value: "±0,5", unit: "°" },
          ],
        },
      },
      {
        id: "e4",
        position: 3,
        type: "video",
        data: { vimeoId: VIDEO.soldadura, caption: "Soldadura de línea regular sobre la pista." },
      },
    ],
  }),

  complejo({
    slug: "desfile-de-tubos",
    title: "Desfile de tubos",
    subtitle: "Del acopio a la pista",
    summary:
      "Los tubos de 24 m salen del acopio y se distribuyen a lo largo de la pista, en el orden exacto en que se van a soldar.",
    vimeoId: VIDEO.desfile,
    locationName: "Medanito",
    punto: [-67.938, -38.19],
    tags: ["logística"],
    orderIndex: 6,
    publishedAt: "2026-03-19T12:00:00Z",
    blocks: [
      { id: "f1", position: 0, type: "video", data: { vimeoId: VIDEO.desfile } },
      {
        id: "f2",
        position: 1,
        type: "text",
        data: {
          body: "El desfile no es solo transporte: cada tubo tiene número, y el orden en que se deposita sobre la pista determina la secuencia de soldadura de los días siguientes. **Un error de orden se paga con jornadas perdidas.**",
        },
      },
      {
        id: "f3",
        position: 2,
        type: "video",
        data: { vimeoId: VIDEO.tocoAToco, caption: "Empalmes entre tramos ya soldados." },
      },
    ],
  }),

  complejo({
    slug: "uam-alvs-allen",
    title: "UAM ALVS",
    subtitle: "Unidad de medición · fin de traza",
    summary:
      "Donde cierra la traza y arranca la medición fiscal hacia Puerto Rosales. El equipo, en un modelo 3D navegable.",
    locationName: "Allen",
    punto: [-67.858, -38.935],
    tags: ["medición", "comisionado", "3D"],
    orderIndex: 7,
    publishedAt: "2026-03-12T12:00:00Z",
    blocks: [
      {
        id: "g1",
        position: 0,
        type: "sketchfab",
        data: {
          modelId: SKETCHFAB_UAM,
          title: "UAM_low",
          caption: "Modelo 3D de la unidad de medición, por Tronadores. Se puede rotar y acercar.",
        },
      },
      {
        id: "g2",
        position: 1,
        type: "text",
        data: {
          heading: "Medir es la última etapa",
          body: "En Allen cierra la traza y empieza otra cosa: la medición fiscal del crudo que sigue hacia Puerto Rosales.\n\nLa unidad de medición es el punto donde el volumen deja de ser una estimación y pasa a ser un número con valor contractual. Dos líneas al inicio, con previsión de ampliación futura.",
        },
      },
      {
        id: "g3",
        position: 2,
        type: "gallery",
        data: { caption: "Patio de tanques y sala eléctrica nueva", images: [] },
      },
    ],
  }),
];

/* ------------------------------------------------------------------ */
/* Serie corta — los contenidos simples                                */
/* ------------------------------------------------------------------ */

/**
 * Van en orden de proceso constructivo, no de fecha: así el encadenado
 * automático cuenta la obra de principio a fin sin que haga falta elegir.
 */
const CORTOS: {
  slug: string;
  title: string;
  summary: string;
  vimeoId: string;
  locationName: string;
}[] = [
  {
    slug: "topografia",
    title: "Topografía",
    summary: "El replanteo que baja el proyecto al terreno: eje, ancho de pista y progresivas.",
    vimeoId: VIDEO.topografia,
    locationName: "Tramo norte",
  },
  {
    slug: "geodeteccion",
    title: "Geodetección",
    summary: "Buscar lo que ya está enterrado antes de abrir la zanja.",
    vimeoId: VIDEO.geodeteccion,
    locationName: "Tramo norte",
  },
  {
    slug: "zanjeo",
    title: "Zanjeo",
    summary: "Profundidad, talud y por qué el suelo manda sobre el plan de avance.",
    vimeoId: VIDEO.zanjeo,
    locationName: "Crucero Catriel",
  },
  {
    slug: "acopio",
    title: "Acopio",
    summary: "Recepción, clasificación y guarda del tubo antes de que salga a pista.",
    vimeoId: VIDEO.acopio,
    locationName: "Acopio 1",
  },
  {
    slug: "planta-de-doble-junta",
    title: "Planta de doble junta",
    summary: "Dos tubos de 12 metros se convierten en uno de 24, con arco sumergido.",
    vimeoId: VIDEO.dobleJunta,
    locationName: "Acopio 1",
  },
  {
    slug: "curvado",
    title: "Curvado",
    summary: "Doblado en frío, de a pocos grados por pasada, para acompañar el terreno.",
    vimeoId: VIDEO.curvado,
    locationName: "Tramo medio",
  },
  {
    slug: "desfile",
    title: "Desfile de tubos",
    summary: "La distribución sobre la pista, en el orden en que se van a soldar.",
    vimeoId: VIDEO.desfile,
    locationName: "Medanito",
  },
  {
    slug: "soldadura-linea-regular",
    title: "Soldadura de línea regular",
    summary: "La costura que une tubo con tubo a lo largo de la pista.",
    vimeoId: VIDEO.soldadura,
    locationName: "Tramo medio",
  },
  {
    slug: "toco-a-toco",
    title: "Toco a toco",
    summary: "Los empalmes que cierran los tramos ya soldados entre sí.",
    vimeoId: VIDEO.tocoAToco,
    locationName: "Tramo sur",
  },
];

export const SEED_CORTOS: Content[] = CORTOS.map((c, i) => ({
  id: c.slug,
  slug: c.slug,
  type: "simple",
  status: "published",
  title: c.title,
  subtitle: null,
  summary: c.summary,
  coverUrl: null, // la resuelve Vimeo
  vimeoId: c.vimeoId,
  durationSeconds: null, // la resuelve Vimeo
  locationName: c.locationName,
  kp: null,
  lat: null,
  lng: null,
  tags: ["serie"],
  orderIndex: i + 1,
  publishedAt: `2026-04-${String(20 - i).padStart(2, "0")}T12:00:00Z`,
  blocks: [],
}));

export const SEED_CONTENIDOS: Content[] = [...SEED_COMPLEJOS, ...SEED_CORTOS];

// El slug es la clave única de `contents` y también la URL. Un duplicado acá no
// rompe nada en memoria, pero al importar a Supabase el segundo se descarta en
// silencio y el contenido desaparece sin aviso. Mejor que falle al arrancar.
const slugsRepetidos = SEED_CONTENIDOS.map((c) => c.slug).filter(
  (slug, i, todos) => todos.indexOf(slug) !== i,
);
if (slugsRepetidos.length > 0) {
  throw new Error(`Slugs duplicados en el seed: ${[...new Set(slugsRepetidos)].join(", ")}`);
}

/* ------------------------------------------------------------------ */
/* Filas del carrusel                                                  */
/* ------------------------------------------------------------------ */

const porSlug = (slugs: string[]) =>
  slugs.map((s) => SEED_CORTOS.find((c) => c.slug === s)!).filter(Boolean);

/**
 * Solo contenidos simples: el carrusel de la home es la serie corta. A las
 * publicaciones se llega desde sus puntos en el mapa.
 */
export const SEED_RAILS: Rail[] = [
  {
    id: "serie-un-minuto",
    slug: "serie-un-minuto",
    title: "Serie · un minuto de ingeniería",
    orderIndex: 1,
    items: SEED_CORTOS,
  },
  {
    id: "antes-del-cano",
    slug: "antes-del-cano",
    title: "Antes del caño",
    orderIndex: 2,
    items: porSlug(["topografia", "geodeteccion", "zanjeo"]),
  },
  {
    id: "fabricacion-y-montaje",
    slug: "fabricacion-y-montaje",
    title: "Fabricación y montaje",
    orderIndex: 3,
    items: porSlug([
      "acopio",
      "planta-de-doble-junta",
      "curvado",
      "desfile",
      "soldadura-linea-regular",
      "toco-a-toco",
    ]),
  },
];
