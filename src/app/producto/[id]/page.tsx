import { redirect } from "next/navigation";
import ProductDetailClient, {
  type ProductDetailData,
  type ProductDetailImage,
  type ProductDetailVariant,
} from "./ProductDetailClient";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  has_sizes: boolean | null;
  is_active: boolean;
};

type ProductVariantRow = {
  id: string;
  product_id: string;
  size: string;
  stock: number;
};

export const dynamic = "force-dynamic";

async function getProduct(id: string): Promise<ProductRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, description, price, category, has_sizes, is_active")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getProductImages(productId: string): Promise<ProductDetailImage[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("id, product_id, storage_path, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true, nullsFirst: true });

  if (error || !data) {
    return [];
  }

  const images: ProductDetailImage[] = [];

  for (const image of data) {
    const imageUrl = getPublicProductImageUrl(image.storage_path);

    if (imageUrl) {
      images.push({
        id: image.id,
        product_id: image.product_id,
        image_url: imageUrl,
        image_alt: null,
        sort_order: image.sort_order,
      });
    }
  }

  return images;
}

async function getProductVariants(
  productId: string,
): Promise<ProductDetailVariant[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, product_id, size, stock")
    .eq("product_id", productId)
    .order("size", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data
    .filter((variant: ProductVariantRow) => typeof variant.size === "string" && variant.size.trim().length > 0)
    .map((variant: ProductVariantRow) => ({
      id: variant.id,
      product_id: variant.product_id,
      size: variant.size.trim().toUpperCase(),
      stock: Number.isFinite(variant.stock) ? variant.stock : 0,
    }))
    .sort((left, right) => left.size.localeCompare(right.size));
}

async function getProductDetail(id: string): Promise<ProductDetailData | null> {
  try {
    const product = await getProduct(id);

    if (!product) {
      return null;
    }

    const [images, variants] = await Promise.all([
      getProductImages(product.id),
      getProductVariants(product.id),
    ]);

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      images,
      variants,
    };
  } catch (error) {
    console.error("No fue posible obtener el detalle del producto ADA.", error);
    return null;
  }
}

function getPublicProductImageUrl(storagePath: string | null): string | null {
  if (!storagePath) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/product-images/${storagePath.replace(/^\//, "")}`;
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductDetail(id);

  if (!product) {
    redirect("/tienda");
  }

  return <ProductDetailClient product={product} />;
}
