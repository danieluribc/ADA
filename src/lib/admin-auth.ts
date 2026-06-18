import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase-server";

export type AdminProfile = {
  role: string | null;
};

export type AdminSession = {
  user: User;
  profile: AdminProfile;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    if (profile.role !== "admin") {
      return null;
    }

    return { user: authData.user, profile };
  } catch (error) {
    console.error("No fue posible verificar la sesión de administrador.", error);
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
