import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * En Next 16 el middleware pasó a llamarse Proxy. Acá hace dos cosas:
 *
 * 1. Refresca el token de Supabase y reescribe las cookies. Sin esto la sesión
 *    del backoffice se cae sola cuando expira el access token.
 * 2. Corta el paso a /admin sin sesión. Es un filtro optimista de navegación:
 *    la autorización real la hacen RLS y el chequeo dentro de cada Server
 *    Action, que es lo que no se puede saltear con un POST directo.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esLogin = pathname === "/admin/login";

  if (!user && pathname.startsWith("/admin") && !esLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("volverA", pathname);
    return NextResponse.redirect(url);
  }

  if (user && esLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
