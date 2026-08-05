import SiteHeader from "@/components/SiteHeader";
import MapaCliente from "@/components/map/MapaCliente";
import ContentDrawer from "@/components/rail/ContentDrawer";
import { getEspeciales, getSimples } from "@/lib/content/repository";
import { getTrazaCoords } from "@/lib/traza-server";
import type { Rail } from "@/lib/types";

export default async function Home() {
  const [especiales, simples] = await Promise.all([getEspeciales(), getSimples()]);
  const traza = getTrazaCoords();

  // Un solo carrusel con todos los simples, sin clasificar por filas: a los
  // especiales se llega desde sus puntos en el mapa, que es lo que les da
  // sentido a ellos; los simples son la playlist única del proceso.
  const rails: Rail[] =
    simples.length > 0
      ? [{ id: "serie", slug: "serie", title: "Serie · un minuto de ingeniería", orderIndex: 0, items: simples }]
      : [];

  return (
    <div className="relative h-dvh overflow-hidden">
      <MapaCliente contenidos={especiales} traza={traza} />
      <SiteHeader activo="traza" contenidos={especiales.length} />
      <ContentDrawer rails={rails} especiales={especiales} />
    </div>
  );
}
