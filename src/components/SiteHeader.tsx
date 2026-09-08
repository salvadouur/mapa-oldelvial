import fs from "node:fs";
import path from "node:path";
import MarcaConFicha from "./MarcaConFicha";
import NavToggle from "./NavToggle";

interface Props {
  /** Ruta activa, para deslizar el conmutador al modo correspondiente. */
  activo?: "traza" | "serie";
  /** Sobre el mapa el header flota; en las fichas se apoya en el fondo. */
  variante?: "flotante" | "solido";
  /** Bloque libre a la derecha (ej. el título de la publicación abierta). */
  derecha?: React.ReactNode;
  /** Cuelga la ficha de obra del logo del programa. En todo el sitio. */
  conFicha?: boolean;
}

/**
 * Logos en `public/`, por orden de preferencia: se usa el primero que exista.
 * Alcanza con dejar el archivo en su lugar para que aparezca.
 */
const CANDIDATOS_LOGO = [
  "LOGO_PROGRAMA DUPLICAR NORTE_600.png",
  "logo-duplicar-norte.svg",
  "logo-duplicar-norte.png",
  "logo.svg",
  "logo.png",
];

const CANDIDATOS_TITULAR = ["Logo_ODV.png", "logo-oldelval.svg", "logo-oldelval.png"];

function buscar(candidatos: string[]): string | null {
  for (const archivo of candidatos) {
    if (fs.existsSync(path.join(process.cwd(), "public", archivo))) {
      // Los nombres tienen espacios: sin codificar, el navegador no los resuelve.
      return `/${encodeURIComponent(archivo)}`;
    }
  }
  return null;
}

export default function SiteHeader({
  activo,
  variante = "flotante",
  derecha,
  conFicha = true,
}: Props) {
  return (
    <header
      className={`z-40 flex items-center justify-between gap-4 px-4 py-4 md:px-8 md:py-5 ${
        variante === "flotante"
          ? "absolute inset-x-0 top-0 bg-gradient-to-b from-abyss/80 to-transparent"
          : "sticky top-0 border-b border-line bg-abyss/85 backdrop-blur-xl"
      }`}
    >
      <MarcaConFicha
        logo={buscar(CANDIDATOS_LOGO)}
        logoTitular={buscar(CANDIDATOS_TITULAR)}
        conFicha={conFicha}
      />

      {derecha ?? <NavToggle activo={activo} />}
    </header>
  );
}
