import Link from "next/link";
import { listarContenidos } from "@/lib/content/admin";
import { formatDuracion, formatFecha } from "@/lib/format";
import type { Content } from "@/lib/types";
import FilaContenido from "./FilaContenido";

export default async function ContenidosPage() {
  const contenidos = await listarContenidos();

  const especiales = contenidos.filter((c) => c.type === "especial");
  const simples = contenidos.filter((c) => c.type === "simple");
  const borradores = contenidos.filter((c) => c.status === "draft").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Contenidos</h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {contenidos.length} en total · {especiales.length} especiales · {simples.length} simples
            {borradores > 0 && ` · ${borradores} sin publicar`}
          </p>
        </div>

        <Link
          href="/admin/contenido/nuevo"
          className="label-tech rounded-lg bg-cyan px-4 py-2.5 text-abyss transition-opacity hover:opacity-90"
        >
          + Nuevo contenido
        </Link>
      </header>

      {contenidos.length === 0 ? (
        <Vacio />
      ) : (
        <div className="space-y-10">
          <Grupo
            titulo="Especiales"
            descripcion="Georreferenciados sobre la traza. Se abren como ficha completa desde el mapa."
            items={especiales}
          />
          <Grupo
            titulo="Simples"
            descripcion="Los videos de ~1 minuto: carrusel de la home y playlist de la serie."
            items={simples}
          />
        </div>
      )}
    </main>
  );
}

function Grupo({
  titulo,
  descripcion,
  items,
}: {
  titulo: string;
  descripcion: string;
  items: Content[];
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <header className="mb-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{titulo}</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-faint">{descripcion}</p>
      </header>

      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {items.map((c) => (
          <li key={c.id}>
            <FilaContenido
              contenido={c}
              meta={[
                c.locationName,
                c.kp,
                c.durationSeconds ? formatDuracion(c.durationSeconds) : null,
                c.status === "published" ? formatFecha(c.publishedAt) : null,
                `${c.blocks.length} bloque${c.blocks.length === 1 ? "" : "s"}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Vacio() {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
      <p className="text-[15px] font-medium text-ink">Todavía no hay contenidos cargados</p>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-soft">
        Creá el primero: un especial georreferenciado sobre la traza, o un video simple para la
        serie.
      </p>
      <Link
        href="/admin/contenido/nuevo"
        className="label-tech mt-6 inline-block rounded-lg bg-cyan px-4 py-2.5 text-abyss transition-opacity hover:opacity-90"
      >
        + Nuevo contenido
      </Link>
    </div>
  );
}
