import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  AUTH_STORAGE_KEY,
  createCookieStorage,
  getSupabaseEnv,
} from "./supabase-auth";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: AUTH_STORAGE_KEY,
        storage: createCookieStorage(),
        userStorage: createCookieStorage(),
      },
    });
  }

  return browserClient;
}

export const supabase = createSupabaseBrowserClient();
