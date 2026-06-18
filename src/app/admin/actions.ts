"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export type AdminActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export async function signOutAdmin(): Promise<AdminActionResult> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No fue posible cerrar sesión.",
    };
  }
}
