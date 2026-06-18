// src/app/admin/actions.ts
"use server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AdminActionResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Cierre de sesión requerido por AdminSidebar
 */
export async function signOutAdmin(): Promise<AdminActionResult> {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.auth.signOut();

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('auth')) {
        cookieStore.set({
          name: cookie.name,
          value: '',
          expires: new Date(0),
          path: '/',
        });
      }
    });

    redirect("/admin/login");
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No fue posible cerrar sesión.",
    };
  }
}