import Link from "next/link";

const PASOS = [
  {
    titulo: "Crear el proyecto en Supabase",
    detalle: "supabase.com → New project. Anotá la URL y la anon key de Settings → API.",
  },
  {
    titulo: "Correr la migración",
    detalle:
      "Pegá supabase/migrations/0001_init.sql en el SQL Editor, y después supabase/seed.sql para crear las filas del carrusel.",
  },
  {
    titulo: "Completar .env.local",
    detalle:
      "Copiá .env.example a .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY, y reiniciá el servidor.",
  },
  {
    titulo: "Crear y habilitar el usuario",
    detalle:
      "Authentication → Users → Add user, y después sumarlo a la tabla backoffice_admins. Estar autenticado no alcanza para escribir: ver supabase/INSTALAR.md.",
  },
];

export default function SinSupabase() {
  return (
    <div className="grid min-h-dvh place-items-center bg-abyss px-6 py-16">
      <div className="w-full max-w-lg">
        <p className="label-tech text-cyan">Backoffice</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
          Falta conectar Supabase
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          El sitio público está funcionando con el contenido de demostración. Para poder cargar y
          publicar contenido real hacen falta cuatro pasos.
        </p>

        <ol className="mt-8 space-y-3">
          {PASOS.map((paso, i) => (
            <li key={paso.titulo} className="panel flex gap-4 p-4">
              <span className="label-tech shrink-0 text-cyan">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{paso.titulo}</span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-soft">
                  {paso.detalle}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <Link
          href="/"
          className="label-tech mt-8 inline-block text-ink-faint transition-colors hover:text-cyan"
        >
          ← Volver al sitio
        </Link>
      </div>
    </div>
  );
}
