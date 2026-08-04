import SiteHeader from "@/components/SiteHeader";
import MapaCliente from "@/components/map/MapaCliente";
import ContentDrawer from "@/components/rail/ContentDrawer";
import { getEspeciales, getRails } from "@/lib/content/repository";
import { getTrazaCoords } from "@/lib/traza-server";

export default async function Home() {
  const [especiales, todasLasFilas] = await Promise.all([getEspeciales(), getRails()]);
  const traza = getTrazaCoords();

  // El carrusel es solo de contenidos simples. A los especiales se llega desde
  // sus puntos en el mapa, que es lo que les da sentido: cada uno está anclado
  // al lugar donde pasó lo que muestra.
  const rails = todasLasFilas
    .map((fila) => ({ ...fila, items: fila.items.filter((c) => c.type === "simple") }))
    .filter((fila) => fila.items.length > 0);

  return (
    <div className="relative h-dvh overflow-hidden">
      <MapaCliente contenidos={especiales} traza={traza} />
      <SiteHeader activo="traza" />
      <ContentDrawer rails={rails} />
    </div>
  );
}
