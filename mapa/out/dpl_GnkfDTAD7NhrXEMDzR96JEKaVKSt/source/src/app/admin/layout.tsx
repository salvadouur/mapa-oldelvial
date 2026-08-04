import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import SinSupabase from "./SinSupabase";

export const metadata: Metadata = {
  title: "Backoffice",
  robots: { index: false, follow: false },
};

// El backoffice depende de la sesión del request: nunca se prerrenderiza.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // El sitio público funciona con el contenido de demostración, pero el
  // backoffice no tiene sentido sin base: en vez de fallar, explica qué falta.
  if (!isSupabaseConfigured()) return <SinSupabase />;

  return <div className="min-h-dvh bg-abyss">{children}</div>;
}
