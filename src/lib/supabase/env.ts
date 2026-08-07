/**
 * El sitio arranca y se ve completo sin Supabase: si faltan las variables, la
 * capa de datos cae a `src/lib/content/seed.ts`. Eso permite maquetar y
 * demostrar sin infraestructura, y conectar la base después sin tocar la UI.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
