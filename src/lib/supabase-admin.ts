// src/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // <-- CLAVE CRUCIAL

  // Validamos de inmediato en la terminal si las llaves existen
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "❌ ERROR CRÍTICO: Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno."
    );
  }

  // Creamos el cliente con la service_role_key para BYPASSEAR el RLS por completo
  return createClient(supabaseUrl || "", serviceRoleKey || "", {
    auth: {
      persistSession: false, // Evita conflictos de sesión en el servidor
      autoRefreshToken: false,
    },
  });
}