import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SerieFeed from "@/components/serie/SerieFeed";
import { getEspeciales, getSimples } from "@/lib/content/repository";
import SerieVacia from "./SerieVacia";

export const metadata: Metadata = {
  title: "Serie · un minuto de ingeniería",
  description:
    "Videos cortos sobre cómo se construye la traza Auca Mahuida — Allen, uno atrás del otro.",
};

export default async function SeriePage() {
  const [simples, especiales] = await Promise.all([getSimples(), getEspeciales()]);
  if (simples.length === 0) return <SerieVacia />;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-abyss">
      <SiteHeader activo="serie" variante="solido" />
      <SerieFeed simples={simples} especiales={especiales} slugInicial={simples[0].slug} />
    </div>
  );
}
