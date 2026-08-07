import { listarContenidos, listarFilas } from "@/lib/content/admin";
import EditorCarrusel from "./EditorCarrusel";

export default async function CarruselPage() {
  const [filas, contenidos] = await Promise.all([listarFilas(), listarContenidos()]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Carrusel</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
          Las filas que se ven bajo el mapa, en orden. La primera es la que queda visible con el
          cajón contraído.
        </p>
        <p className="mt-3 max-w-2xl rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-soft">
          El carrusel muestra <strong className="text-ink">solo los videos de la serie</strong>. Si
          agregás una publicación del mapa a una fila, no va a aparecer: a esas se llega desde su
          punto en la traza.
        </p>
      </header>

      <EditorCarrusel filas={filas} contenidos={contenidos} />
    </main>
  );
}
