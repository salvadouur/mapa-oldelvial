import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SerieFeed from "@/components/serie/SerieFeed";
import { getEspeciales, getSimples } from "@/lib/content/repository";

export async function generateMetadata(props: PageProps<"/serie/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const simples = await getSimples();
  const actual = simples.find((s) => s.slug === slug);
  if (!actual) return { title: "Serie" };

  return {
    title: actual.title,
    description: actual.summary ?? undefined,
  };
}

export default async function SerieItemPage(props: PageProps<"/serie/[slug]">) {
  const { slug } = await props.params;
  const [simples, especiales] = await Promise.all([getSimples(), getEspeciales()]);

  if (!simples.some((s) => s.slug === slug)) notFound();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-abyss">
      <SiteHeader activo="serie" variante="solido" />
      <SerieFeed simples={simples} especiales={especiales} slugInicial={slug} />
    </div>
  );
}
