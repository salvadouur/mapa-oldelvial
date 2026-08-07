import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

/** Estado vacío de la serie: todavía no hay contenidos cortos publicados. */
export default function SerieVacia() {
  return (
    <div className="flex min-h-dvh flex-col bg-abyss">
      <SiteHeader activo="serie" variante="solido" />
      <div className="grid flex-1 place-items-center px-6 py-20 text-center">
        <div className="max-w-md">
          <p className="label-tech text-cyan">Serie · un minuto de ingeniería</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            Todavía no hay videos publicados
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
            Cuando se publique el primer contenido corto desde el backoffice, va a aparecer acá y
            se va a poder ver uno atrás del otro.
          </p>
          <Link
            href="/"
            className="label-tech mt-8 inline-block rounded-full border border-line px-4 py-2 text-ink-soft transition-colors hover:border-cyan/50 hover:text-cyan"
          >
            ← Volver a la traza
          </Link>
        </div>
      </div>
    </div>
  );
}
