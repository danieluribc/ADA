"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type ProductActionResult =
  | {
      ok: true;
      message: string;
      productId: string;
    }
  | {
      ok: false;
      message: string;
    };

type VariantInput = {
  size: string;
  stock: number;
};

const PRODUCT_IMAGES_BUCKET = "product-images";
const ALLOWED_SIZES = ["XS", "S", "M", "L", "XL"] as const;

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parsePriceToCents(value: string): number {
  const normalizedValue = value
    .replace(/\s/g, "")
    .replace("$", "")
    .replace(/\./g, "")
    .replace(",", ".");

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El precio debe ser mayor a $0.00 MXN.");
  }

  return Math.round(amount * 100);
}

function parseVariants(formData: FormData): VariantInput[] {
  const rawVariants = getFormValue(formData, "variants");

  if (!rawVariants) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawVariants) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is VariantInput => {
        if (!item || typeof item !== "object") {
          return false;
        }

        const record = item as Record<string, unknown>;
        const size = typeof record.size === "string" ? record.size.trim().toUpperCase() : "";
        const stock = typeof record.stock === "number" ? record.stock : Number(record.stock);

        return (
          (ALLOWED_SIZES as readonly string[]).includes(size) &&
          Number.isInteger(stock) &&
          stock >= 0
        );
      })
      .map((item) => ({
        size: item.size.toUpperCase(),
        stock: Number(item.stock),
      }));
  } catch {
    return [];
  }
}

function getImages(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0);
}

function getSafeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function rollbackProduct(productId: string) {
  const supabase = createSupabaseAdminClient();

  await supabase.from("product_images").delete().eq("product_id", productId);
  await supabase.from("product_variants").delete().eq("product_id", productId);
  await supabase.from("products").delete().eq("id", productId);
}

export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  const name = getFormValue(formData, "name");
  const description = getFormValue(formData, "description");
  const category = getFormValue(formData, "category");
  const hasSizes = formData.get("has_sizes") === "true";
  const variants = parseVariants(formData);
  const images = getImages(formData);

  try {
    if (!name) {
      return { ok: false, message: "El nombre del producto es requerido." };
    }

    if (!category) {
      return { ok: false, message: "La categoría es requerida." };
    }

    let priceInCents: number;

    try {
      priceInCents = parsePriceToCents(getFormValue(formData, "price"));
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "El precio no es válido.",
      };
    }

    if (hasSizes && variants.length === 0) {
      return { ok: false, message: "Agrega al menos una talla con stock disponible." };
    }

    const supabase = createSupabaseAdminClient();
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name,
        description: description || null,
        price: priceInCents,
        category,
        has_sizes: hasSizes,
        is_active: true,
      })
      .select("id")
      .single();

    if (productError || !product) {
      return {
        ok: false,
        message: productError?.message ?? "No fue posible guardar el producto.",
      };
    }

    const productId = product.id;

    try {
      if (images.length > 0) {
        const imageRows = [];

        for (const [index, file] of images.entries()) {
          const storagePath = `products/${productId}/${Date.now()}-${index}-${getSafeFileName(file.name)}`;
          const { data: uploadedFile, error: uploadError } = await supabase.storage
            .from(PRODUCT_IMAGES_BUCKET)
            .upload(storagePath, file, {
              cacheControl: "3600",
              contentType: file.type || "image/jpeg",
              upsert: false,
            });

          if (uploadError || !uploadedFile) {
            throw new Error(uploadError?.message ?? "No fue posible subir la imagen.");
          }

          imageRows.push({
            product_id: productId,
            storage_path: uploadedFile.path,
            sort_order: index,
          });
        }

        if (imageRows.length > 0) {
          const { error: imagesError } = await supabase
            .from("product_images")
            .insert(imageRows);

          if (imagesError) {
            throw new Error(imagesError.message);
          }
        }
      }

      if (hasSizes && variants.length > 0) {
        const { error: variantsError } = await supabase
          .from("product_variants")
          .insert(
            variants.map((variant) => ({
              product_id: productId,
              size: variant.size,
              stock: variant.stock,
            })),
          );

        if (variantsError) {
          throw new Error(variantsError.message);
        }
      }

      revalidatePath("/admin/productos");

      return {
        ok: true,
        message: "Producto guardado con éxito en Supabase.",
        productId,
      };
    } catch (error) {
      await rollbackProduct(productId);

      return {
        ok: false,
        message: error instanceof Error ? error.message : "No fue posible completar el guardado.",
      };
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No fue posible guardar el producto.",
    };
  }
}
