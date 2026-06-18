// src/app/admin/productos/actions.ts
"use server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

// Tipado nativo para la respuesta que espera tu interfaz
export type ProductActionResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * 1. CREACIÓN: Registrar un producto nuevo en el catálogo de ADA
 */
export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  try {
    const supabase = createSupabaseAdminClient();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseInt(formData.get("price") as string, 10);
    const category = formData.get("category") as string;
    const has_sizes = formData.get("has_sizes") === "true";

    if (!name || isNaN(price)) {
      return { ok: false, message: "El nombre y el precio son obligatorios." };
    }

    const { error } = await supabase
      .from("products")
      .insert([
        {
          name,
          description,
          price,
          category,
          has_sizes,
          is_active: true
        }
      ]);

    if (error) {
      console.error("Error de Supabase al crear producto:", error.message);
      return { ok: false, message: `Error en Base de Datos: ${error.message}` };
    }

    revalidatePath("/admin/productos");
    return { ok: true };

  } catch (error) {
    console.error("Error crítico en createProduct:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Error inesperado al crear el producto.",
    };
  }
}

/**
 * 2. RESTAURACIÓN: Modificar el estado activo/inactivo de una prenda
 */
export async function updateProductActive(productId: string, isActive: boolean): Promise<ProductActionResult> {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("id", productId);

    if (error) {
      console.error(`Error de Supabase al actualizar producto ${productId}:`, error.message);
      return { ok: false, message: `Error en Base de Datos: ${error.message}` };
    }

    revalidatePath("/admin/productos");
    return { ok: true };
  } catch (error) {
    console.error("Error crítico en updateProductActive:", error);
    return { ok: false, message: "Error inesperado al actualizar el estado del producto." };
  }
}

/**
 * 3. RESTAURACIÓN: Eliminar físicamente un producto del catálogo
 */
export async function deleteProduct(productId: string): Promise<ProductActionResult> {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error(`Error de Supabase al borrar producto ${productId}:`, error.message);
      return { ok: false, message: `Error en Base de Datos: ${error.message}` };
    }

    revalidatePath("/admin/productos");
    return { ok: true };
  } catch (error) {
    console.error("Error crítico en deleteProduct:", error);
    return { ok: false, message: "Error inesperado al eliminar el producto." };
  }
}