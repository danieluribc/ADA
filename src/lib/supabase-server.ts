import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  AUTH_STORAGE_KEY,
  getCookieOptions,
  getSupabaseEnv,
} from "./supabase-auth";

type RequestCookieStore = Awaited<ReturnType<typeof cookies>>;

function createServerCookieStorage(cookieStore: RequestCookieStore) {
  return {
    isServer: true,
    async getItem(key: string) {
      return cookieStore.get(key)?.value ?? null;
    },
    async setItem(key: string, value: string) {
      try {
        cookieStore.set(key, value, getCookieOptions());
      } catch {
        return;
      }
    },
    async removeItem(key: string) {
      try {
        cookieStore.set(key, "", { ...getCookieOptions(), maxAge: 0 });
      } catch {
        return;
      }
    },
  };
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: AUTH_STORAGE_KEY,
      storage: createServerCookieStorage(cookieStore),
      userStorage: createServerCookieStorage(cookieStore),
    },
  });
}
