/**
 * Datos de la obra.
 *
 * Fuente: la presentación "Micrositio Duplicar Norte — Propuesta contenido +
 * diseño" (v1, 21/05/2026). Son cifras del cliente: si cambian, se corrigen
 * acá y se actualizan en el panel del mapa sin tocar componentes.
 */

export const OBRA = {
  /** Nombre completo del programa. Es así como se nombra en todo el sitio. */
  nombre: "Programa Duplicar Norte",
  titular: "Oldelval",
  bajada: "Ampliación del oleoducto, entre Auca Mahuida y Allen.",
} as const;

export interface CifraObra {
  /** Valor grande. Se muestra con la tipografía de titular. */
  valor: string;
  unidad?: string;
  etiqueta: string;
  /** Una línea de contexto, visible con el panel desplegado. */
  detalle: string;
}

export const CIFRAS: CifraObra[] = [
  {
    valor: "207",
    unidad: "km",
    etiqueta: "Longitud",
    detalle: "Nuevo ducto paralelo a los existentes.",
  },
  {
    valor: "24",
    unidad: "″",
    etiqueta: "Diámetro",
    detalle: "Diseño de alta resistencia.",
  },
  {
    valor: "30.673",
    unidad: "t",
    etiqueta: "Acero",
    detalle: "Soporta las presiones de bombeo del crudo de Vaca Muerta.",
  },
  {
    valor: "163",
    etiqueta: "Cruces especiales",
    detalle: "Desafíos de ingeniería a lo largo de la traza.",
  },
];

/** Contexto del sistema en el que se inserta la obra. */
export const CONTEXTO: { valor: string; texto: string }[] = [
  { valor: "+50%", texto: "del petróleo que se produce en la Argentina viaja por la red de Oldelval" },
  { valor: "75%", texto: "del petróleo de la Cuenca Neuquina" },
  { valor: "4ta", texto: "reserva mundial de petróleo no convencional: Vaca Muerta" },
];

/** Qué resuelve la obra, en una línea. */
export const CLAIM = "Elimina las restricciones de transporte del Hub Norte.";
