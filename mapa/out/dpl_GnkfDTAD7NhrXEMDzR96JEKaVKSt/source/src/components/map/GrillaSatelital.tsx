/**
 * Retícula sobre el mapa.
 *
 * Dos grillas superpuestas —una fina y una gruesa— más marcas de esquina y
 * ticks en los bordes. Le da al mapa la textura de una pantalla de instrumento
 * en vez de la de un visor de fotos, y de paso ayuda a leer distancias.
 *
 * Es puramente decorativa: no intercepta el mouse, así que el mapa sigue
 * respondiendo normalmente por debajo.
 */
export default function GrillaSatelital() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {/* Grilla fina */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(140,215,245,0.10) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(140,215,245,0.10) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      {/* Grilla gruesa: cada cinco divisiones, como la escala de un instrumento */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(140,215,245,0.19) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(140,215,245,0.19) 1px, transparent 1px)",
          backgroundSize: "150px 150px",
        }}
      />

      {/* Viñeta: hunde los bordes y deja el centro limpio */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(3,6,13,0.55) 100%)",
        }}
      />

      <MarcasDeEsquina />
      <TicksDeBorde />
    </div>
  );
}

function MarcasDeEsquina() {
  const comun = "absolute h-5 w-5 border-cyan/25";
  return (
    <>
      <span className={`${comun} top-16 left-3 border-t border-l md:top-20 md:left-6`} />
      <span className={`${comun} top-16 right-3 border-t border-r md:top-20 md:right-6`} />
      <span className={`${comun} bottom-3 left-3 border-b border-l md:bottom-6 md:left-6`} />
      <span className={`${comun} right-3 bottom-3 border-r border-b md:right-6 md:bottom-6`} />
    </>
  );
}

/** Ticks sobre el borde superior, como la escala de un instrumento. */
function TicksDeBorde() {
  return (
    <div className="absolute inset-x-0 top-16 hidden justify-between px-10 md:flex md:top-20">
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className="block w-px bg-cyan/20"
          style={{ height: i % 4 === 0 ? 9 : 4 }}
        />
      ))}
    </div>
  );
}
