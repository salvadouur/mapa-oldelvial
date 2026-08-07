import Link from "next/link";
import { cerrarSesion } from "../actions";
import { esAdmin, usuarioActual } from "@/lib/content/admin";
import NavAdmin from "./NavAdmin";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioActual();

  // Estar logueado no alcanza. Sin esta pantalla, un usuario no habilitado
  // vería el panel vacío y pensaría que se rompió algo, cuando en realidad la
  // base le está rechazando las consultas.
  if (usuario && !(await esAdmin())) return <NoHabilitado email={usuario.email} />;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-abyss/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 md:px-8">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="leading-tight">
              <span className="block text-[13px] font-semibold tracking-tight text-ink">
                Duplicar Norte
              </span>
              <span className="label-tech block text-[9px] text-cyan">Backoffice</span>
            </Link>
            <NavAdmin />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="label-tech hidden text-ink-faint transition-colors hover:text-cyan sm:block"
            >
              Ver el sitio ↗
            </Link>
            {usuario?.email && (
              <span className="label-tech hidden text-[9px] text-ink-faint lg:block">
                {usuario.email}
              </span>
            )}
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="label-tech rounded-lg border border-line px-3 py-2 text-ink-soft transition-colors hover:border-amber/50 hover:text-amber"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}

function NoHabilitado({ email }: { email?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="label-tech text-amber">Acceso no habilitado</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
          Tu usuario todavía no puede administrar el sitio
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          {email ? (
            <>
              Entraste como <span className="text-ink">{email}</span>, pero ese usuario no está en
              la lista de habilitados.
            </>
          ) : (
            "Este usuario no está en la lista de habilitados."
          )}{" "}
          La habilitación se otorga a mano desde Supabase, en la tabla{" "}
          <code className="text-cyan">backoffice_admins</code>.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="label-tech rounded-lg border border-line px-4 py-2.5 text-ink-soft transition-colors hover:border-amber/50 hover:text-amber"
            >
              Salir
            </button>
          </form>
          <Link
            href="/"
            className="label-tech rounded-lg px-4 py-2.5 text-ink-faint transition-colors hover:text-cyan"
          >
            Ir al sitio
          </Link>
        </div>
      </div>
    </div>
  );
}
