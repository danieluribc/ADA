import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_STORAGE_KEY } from "@/lib/supabase-auth"; // <-- Sincronizamos la misma llave exacta del login

export async function middleware(request: NextRequest) {
  // 1. Regla de escape: Dejar pasar libremente si la ruta es el Login
  if (request.nextUrl.pathname.includes("/admin/login")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // 2. Inicializar el cliente oficial de middleware usando tu llave de almacenamiento
  const supabase = createMiddlewareClient(
    { req: request, res: response },
    {
      cookieOptions: {
        name: AUTH_STORAGE_KEY,
        path: "/",
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        domain: undefined,
      },
    }
  );

  // 3. Validar sesión de usuario de forma segura
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 4. Validar el rol de administrador
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    // Si no es admin, destruimos la sesión inválida para evitar bucles
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};