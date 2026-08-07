import LoginForm from "./LoginForm";

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const { volverA } = await props.searchParams;
  const destino = typeof volverA === "string" && volverA.startsWith("/admin") ? volverA : "/admin";

  return (
    <div className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="label-tech text-cyan">Duplicar Norte</p>
        <h1 className="mt-2.5 text-2xl font-semibold tracking-tight text-ink">Backoffice</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          Entrá con el usuario que se creó en Supabase.
        </p>

        <LoginForm destino={destino} />
      </div>
    </div>
  );
}
