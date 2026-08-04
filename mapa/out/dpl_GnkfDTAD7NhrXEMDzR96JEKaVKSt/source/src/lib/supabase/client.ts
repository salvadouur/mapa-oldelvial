"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

/** Cliente de navegador (login del backoffice y subida de imágenes). */
export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase no está configurado. Definí NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.",
    );
  }
  cached ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}
