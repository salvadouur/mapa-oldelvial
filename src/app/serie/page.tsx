import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SeriePlayer from "@/components/serie/SeriePlayer";
import { getEspeciales, getSimples } from "@/lib/content/repository";
import SerieVacia from "./SerieVacia";

export const metadata: Metadata = {
  title: "Serie",
  description:
    "Videos cortos sobre cómo se construye el Programa Duplicar Norte, uno atrás del otro.",
};

export default async function SeriePage() {
  const [simples, especiales] = await Promise.all([getSimples(), getEspeciales()]);
  if (simples.length === 0) return <SerieVacia />;

  const primerLibre = simples.find((s) => !s.locked) ?? simples[0];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-abyss">
      <SiteHeader activo="serie" variante="solido" />
      <SeriePlayer simples={simples} especiales={especiales} slugInicial={primerLibre.slug} />
    </div>
  );
}
