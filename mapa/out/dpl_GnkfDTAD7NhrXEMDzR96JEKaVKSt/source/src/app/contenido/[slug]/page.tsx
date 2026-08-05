import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Cover from "@/components/Cover";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import { getContentBySlug, getEspeciales } from "@/lib/content/repository";
import { formatDuracion, formatFecha } from "@/lib/format";
import type { Block, Content } from "@/lib/types";

export async function generateMetadata(props: PageProps<"/contenido/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const contenido = await getContentBySlug(slug);
  if (!contenido) return { title: "Contenido no encontrado" };

  return {
    title: contenido.title,
    description: contenido.summary ?? contenido.subtitle ?? undefined,
    openGraph: {
      title: contenido.title,
      description: contenido.summary ?? undefined,
      images: contenido.coverUrl ? [contenido.coverUrl] : undefined,
    },
  };
}

export default async function PublicacionPage(props: PageProps<"/contenido/[slug]">) {
  const { slug } = await props.params;
  const contenido = await getContentBySlug(slug);
  if (!contenido) notFound();

  const especiales = await getEspeciales();
  const indice = especiales.findIndex((c) => c.slug === slug);
  const siguiente = indice >= 0 ? especiales[(indice + 1) % especiales.length] : null;

  const { destacado, resto } = separarDestacado(bloquesEfectivos(contenido));

  return (
    <div className="min-h-dvh bg-abyss">
      <SiteHeader variante="solido" />

      <Hero contenido={contenido} />

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-12 md:px-8 md:py-16">
        {/* El primer video junto al texto de apertura: la lectura arranca con
            imagen y explicación a la vez, como en una ficha de obra. */}
        {destacado && (
          <section className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-12">
            <BlockRenderer bloque={destacado.video} contenido={contenido} />
            <div className="lg:pt-2">
              <p className="label-tech mb-3 text-cyan">Resumen operativo</p>
              <BlockRenderer bloque={destacado.texto} contenido={contenido} />
            </div>
          </section>
        )}

        {resto.map((bloque) => (
          <section key={bloque.id}>
            <BlockRenderer bloque={bloque} contenido={contenido} />
          </section>
        ))}
      </main>

      <PieDePublicacion siguiente={siguiente} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ contenido }: { contenido: Content }) {
  const chips = [
    contenido.locationName,
    contenido.kp,
    contenido.durationSeconds ? `Video · ${formatDuracion(contenido.durationSeconds)}` : null,
    formatFecha(contenido.publishedAt),
  ].filter(Boolean) as string[];

  return (
    <header className="relative isolate flex min-h-[62svh] flex-col justify-end overflow-hidden md:min-h-[74svh]">
      <div className="absolute inset-0 -z-10">
        <Cover slug={contenido.slug} url={contenido.coverUrl} alt="" />
        {/* Velo generoso: cuando la portada sale de la miniatura de Vimeo suele
            traer la placa de título del video, y sin esto compite con el H1. */}
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/82 to-abyss/55" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-12 md:px-8 md:pb-16">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-cyan" />
          <span className="label-tech text-cyan">
            {contenido.locationName ?? "Traza"} · {contenido.type === "especial" ? "Especial" : "Serie"}
          </span>
        </div>

        <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance text-ink md:text-6xl">
          {contenido.title}
        </h1>

        {/* Los simples no tienen subtítulo propio: usan el resumen, que para
            ellos hace las veces de bajada. */}
        {(contenido.subtitle ?? contenido.summary) && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft md:text-xl">
            {contenido.subtitle ?? contenido.summary}
          </p>
        )}

        {chips.length > 0 && (
          <ul className="mt-7 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li
                key={chip}
                className="label-tech rounded-full border border-line bg-abyss/60 px-3 py-1.5 text-ink-soft backdrop-blur"
              >
                {chip}
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}

function PieDePublicacion({ siguiente }: { siguiente: Content | null }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <Link
          href="/"
          className="label-tech flex items-center gap-2 text-ink-faint transition-colors hover:text-cyan"
        >
          ← Volver a la traza
        </Link>

        {siguiente && (
          <Link href={`/contenido/${siguiente.slug}`} className="group text-right">
            <span className="label-tech block text-ink-faint">Próximo especial</span>
            <span className="mt-1 block text-lg font-semibold tracking-tight text-ink transition-colors group-hover:text-cyan">
              {siguiente.title} →
            </span>
          </Link>
        )}
      </div>
    </footer>
  );
}

/**
 * Los simples no tienen bloques propios —viven del video + resumen de nivel
 * superior, pensados para el carrusel y `/serie`—, así que al abrirlos con el
 * mismo formato de ficha que un especial no habría nada que mostrar debajo
 * del hero. Se arma un video + texto de arranque a partir de esos campos,
 * igual que si fueran los dos primeros bloques de un especial.
 */
function bloquesEfectivos(contenido: Content): Block[] {
  if (contenido.blocks.length > 0) return contenido.blocks;
  if (!contenido.vimeoId) return [];

  const bloques: Block[] = [
    { id: "video-principal", position: 0, type: "video", data: { vimeoId: contenido.vimeoId } },
  ];
  if (contenido.summary) {
    bloques.push({
      id: "texto-principal",
      position: 1,
      type: "text",
      data: { body: contenido.summary },
    });
  }
  return bloques;
}

/**
 * Si la publicación empieza con video + texto, se muestran apareados. Devuelve
 * ese par y el resto de los bloques en orden.
 */
function separarDestacado(bloques: Block[]): {
  destacado: { video: Block; texto: Block } | null;
  resto: Block[];
} {
  const [primero, segundo, ...cola] = bloques;
  if (primero?.type === "video" && segundo?.type === "text") {
    return { destacado: { video: primero, texto: segundo }, resto: cola };
  }
  return { destacado: null, resto: bloques };
}
