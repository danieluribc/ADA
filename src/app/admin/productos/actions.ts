// src/app/admin/productos/actions.ts
"use server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export type ProductActionResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * FUNCIÓN INTERNA: Sube archivos y registra enlaces en la tabla product_images
 */
async function uploadAndRegisterImages(files: File[], productId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  let orderIndex = 0;

  for (const file of files) {
    if (file.size === 0) continue;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 5)}.${fileExt}`;
    const storagePath = `${productId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (!uploadError) {
      await supabase
        .from("product_images")
        .insert([
          {
            product_id: productId,
            storage_path: storagePath,
            sort_order: orderIndex
          }
        ]);
      orderIndex++;
    } else {
      console.error("Error subiendo archivo al bucket:", uploadError.message);
    }
  }
}

/**
 * 1. CREACIÓN: Registrar producto y sus imágenes relacionales
 */
export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  try {
    const supabase = createSupabaseAdminClient();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = Math.round(parseFloat(formData.get("price") as string) * 100);
    const category = formData.get("category") as string;
    const has_sizes = formData.get("has_sizes") === "true";

    if (!name || isNaN(price)) {
      return { ok: false, message: "El nombre y el precio son obligatorios." };
    }

    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert([{ name, description, price, category, has_sizes, is_active: true }])
      .select("id")
      .single();

    if (insertError) return { ok: false, message: `Error al crear producto: ${insertError.message}` };

    const fileFields = formData.getAll("images") as File[];
    await uploadAndRegisterImages(fileFields, newProduct.id);

    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    return { ok: true };
  } catch (error) {
    return { ok: false, message: "Error inesperado al crear el producto." };
  }
}

/**
 * 2. EDICIÓN: Actualizar datos y añadir imágenes relacionales nuevas
 */
export async function updateProduct(productId: string, formData: FormData): Promise<ProductActionResult> {
  try {
    const supabase = createSupabaseAdminClient();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = Math.round(parseFloat(formData.get("price") as string) * 100);
    const category = formData.get("category") as string;
    const has_sizes = formData.get("has_sizes") === "true";

    if (!name || isNaN(price)) {
      return { ok: false, message: "El nombre y el precio son obligatorios." };
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ name, description, price, category, has_sizes })
      .eq("id", productId);

    if (updateError) return { ok: false, message: `Error al actualizar: ${updateError.message}` };

    const fileFields = formData.getAll("images") as File[];
    await uploadAndRegisterImages(fileFields, productId);

    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    return { ok: true };
  } catch (error) {
    return { ok: false, message: "Error inesperado al actualizar el producto." };
  }
}

/**
 * 3. CONTROL DE ESTADO: Activar / Desactivar
 */
export async function updateProductActive(productId: string, isActive: boolean): Promise<ProductActionResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", productId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    return { ok: true };
  } catch (error) {
    return { ok: false, message: "Error inesperado." };
  }
}

/**
 * 4. ELIMINACIÓN: Borrar producto
 */
export async function deleteProduct(productId: string): Promise<ProductActionResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    return { ok: true };
  } catch (error) {
    return { ok: false, message: "Error inesperado." };
  }
}