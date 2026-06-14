import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ADVERTENCIA: este archivo SOLO debe ser importado y ejecutado en Server Components o API Routes (Server Side), jamás en archivos con la directiva "use client" para evitar exponer la llave maestra.
export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan las variables de entorno de Supabase para el cliente administrador.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
