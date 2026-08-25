import SiteHeader from "@/components/SiteHeader";
import MapaCliente from "@/components/map/MapaCliente";
import ContentDrawer from "@/components/rail/ContentDrawer";
import { getGeorreferenciados, getRails } from "@/lib/content/repository";
import { getTrazaCoords } from "@/lib/traza-server";

export default async function Home() {
  const [enMapa, todasLasFilas] = await Promise.all([getGeorreferenciados(), getRails()]);
  const traza = getTrazaCoords();

  // El carrusel es de especiales. A los simples se llega por el botón de la
  // serie o tocando sus marcas sobre la traza.
  const rails = todasLasFilas
    .map((fila) => ({ ...fila, items: fila.items.filter((c) => c.type === "especial") }))
    .filter((fila) => fila.items.length > 0);

  return (
    <div className="relative h-dvh overflow-hidden">
      <MapaCliente contenidos={enMapa} traza={traza} />
      <SiteHeader activo="traza" conFicha />
      <ContentDrawer rails={rails} />
    </div>
  );
}
