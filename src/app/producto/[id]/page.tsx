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

const FALLBACK_VARIANTS: ProductDetailVariant[] = [
  { id: "respaldo-xs", product_id: "respaldo", size: "XS", stock: 8 },
  { id: "respaldo-s", product_id: "respaldo", size: "S", stock: 12 },
  { id: "respaldo-m", product_id: "respaldo", size: "M", stock: 10 },
  { id: "respaldo-l", product_id: "respaldo", size: "L", stock: 6 },
];

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
    .select("id, product_id, image_url, image_alt, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true, nullsFirst: true });

  if (error || !data) {
    return [createFallbackImage(productId)];
  }

  const validImages = data
    .filter((image) => typeof image.image_url === "string" && image.image_url.length > 0)
    .map((image) => ({
      id: image.id,
      product_id: image.product_id,
      image_url: image.image_url,
      image_alt: image.image_alt,
      sort_order: image.sort_order,
    }));

  return validImages.length > 0 ? validImages : [createFallbackImage(productId)];
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
    return FALLBACK_VARIANTS;
  }

  const validVariants = data
    .filter((variant) => typeof variant.size === "string" && variant.size.trim().length > 0)
    .map((variant) => ({
      id: variant.id,
      product_id: variant.product_id,
      size: variant.size.trim().toUpperCase(),
      stock: Number.isFinite(variant.stock) ? variant.stock : 0,
    }))
    .sort((left, right) => left.size.localeCompare(right.size));

  return validVariants.length > 0 ? validVariants : FALLBACK_VARIANTS;
}

async function getProductDetail(id: string): Promise<ProductDetailData> {
  try {
    const product = await getProduct(id);

    if (!product) {
      return createFallbackProduct(id);
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
    return createFallbackProduct(id);
  }
}

function createFallbackProduct(id: string): ProductDetailData {
  return {
    id,
    name: "Conjunto ADA Respaldo",
    description:
      "Producto de respaldo para mantener visible la experiencia ADA cuando el catálogo no está disponible.",
    category: "RESPALDO",
    price: 168000,
    images: [createFallbackImage(id)],
    variants: FALLBACK_VARIANTS,
  };
}

function createFallbackImage(productId: string): ProductDetailImage {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200">
      <rect width="900" height="1200" fill="#eeeeee"/>
      <rect x="0" y="0" width="900" height="1200" fill="none" stroke="#000000" stroke-width="2"/>
      <path d="M140 980 C260 820 360 980 480 820 S700 720 780 880" fill="none" stroke="#000000" stroke-width="3"/>
      <text x="60" y="110" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="700" letter-spacing="10">ADA</text>
      <text x="60" y="160" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="400" letter-spacing="4">DETALLE ADA</text>
    </svg>
  `;

  return {
    id: `${productId}-fallback-image`,
    product_id: productId,
    image_url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    image_alt: "Marcador de posición ADA",
    sort_order: 0,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductDetail(id);

  return <ProductDetailClient product={product} />;
}
