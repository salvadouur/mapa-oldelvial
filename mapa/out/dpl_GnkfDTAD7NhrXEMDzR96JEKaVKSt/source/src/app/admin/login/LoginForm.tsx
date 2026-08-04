"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ destino }: { destino: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const { error } = await createClient().auth.signInWithPassword({ email, password });

    if (error) {
      // El mensaje de Supabase llega en inglés y es poco claro para quien
      // administra el sitio.
      setError(
        error.message.includes("Invalid login")
          ? "Email o contraseña incorrectos"
          : error.message,
      );
      setEnviando(false);
      return;
    }

    // `refresh()` fuerza a que el servidor vuelva a leer la cookie de sesión
    // recién escrita antes de navegar.
    router.refresh();
    router.replace(destino);
  }

  return (
    <form onSubmit={enviar} className="mt-8 space-y-3">
      <Campo
        etiqueta="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="username"
        required
      />
      <Campo
        etiqueta="Contraseña"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        required
      />

      {error && (
        <p role="alert" className="rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-[13px] text-amber">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="label-tech w-full rounded-lg bg-cyan py-3 text-abyss transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

function Campo({
  etiqueta,
  value,
  onChange,
  ...rest
}: {
  etiqueta: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="label-tech mb-1.5 block text-ink-faint">{etiqueta}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-cyan"
      />
    </label>
  );
}
