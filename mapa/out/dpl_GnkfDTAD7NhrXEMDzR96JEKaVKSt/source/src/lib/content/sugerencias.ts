import type { Content } from "@/lib/types";

/**
 * El puente entre los dos tipos de contenido.
 *
 * Quien termina de ver un simple de un minuto sobre curvado debería poder
 * saltar al especial georreferenciado que cuenta esa misma etapa en detalle.
 * Sin esto, los dos formatos quedan como dos sitios distintos.
 *
 * El puntaje es deliberadamente simple —etiquetas y lugar compartidos— porque
 * con este volumen de material cualquier cosa más elaborada sería precisión
 * falsa. Cuando haya cientos de videos y datos de reproducción, este es el
 * único archivo que hay que cambiar.
 */
export function especialRelacionado(actual: Content, especiales: Content[]): Content | null {
  const puntaje = (otro: Content) => {
    const etiquetas = otro.tags.filter(
      (t) => actual.tags.includes(t) && t !== "serie",
    ).length;
    const mismoLugar = otro.locationName && otro.locationName === actual.locationName ? 4 : 0;
    return etiquetas * 3 + mismoLugar;
  };

  const mejor = especiales
    .map((e) => ({ e, p: puntaje(e) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p)[0];

  return mejor?.e ?? null;
}
