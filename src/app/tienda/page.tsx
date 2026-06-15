import ProductFilters, { type ProductFiltersProduct } from "@/components/ProductFilters";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type ProductImageRow = {
  storage_path: string | null;
  sort_order: number | null;
};

type ProductRow = ProductFiltersProduct & {
  description: string | null;
  has_sizes: boolean | null;
  is_active: boolean;
  product_images: ProductImageRow[];
};

async function getProducts(): Promise<ProductRow[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        category,
        has_sizes,
        is_active,
        product_images!left (
          storage_path,
          sort_order
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("No fue posible obtener los productos de ADA.", error);
      return [];
    }

    return (data ?? []).map((product) => ({
      ...product,
      image_url: getFirstProductImageUrl(product),
    }));
  } catch (error) {
    console.error("No fue posible obtener los productos de ADA.", error);
    return [];
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

function getFirstProductImageUrl(product: ProductRow): string | null {
  const images = [...product.product_images].sort(
    (left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0),
  );

  return getPublicProductImageUrl(images[0]?.storage_path ?? null);
}

function getUniqueCategories(products: ProductRow[]): string[] {
  return Array.from(
    new Set(
      products
        .map((product) => product.category?.trim().toUpperCase())
        .filter((category): category is string => Boolean(category)),
    ),
  ).sort();
}

export default async function TiendaPage() {
  const products = await getProducts();
  const categories = getUniqueCategories(products);

  return (
    <main>
      <section className="border-b border-primary px-container-margin py-section-gap">
        <p className="font-label-caps text-outline">CATÁLOGO COMPLETO</p>
        <h1 className="mt-5 max-w-5xl font-headline-lg text-primary">
          Tienda ADA
        </h1>
        <p className="mt-6 max-w-2xl font-body-lg text-on-surface-variant">
          Prendas deportivas minimalistas para moverte con intención, limpieza y
          presencia editorial.
        </p>
      </section>

      {products.length > 0 ? (
        <ProductFilters products={products} categories={categories} />
      ) : (
        <section className="flex min-h-[60vh] items-center justify-center px-container-margin py-section-gap">
          <p className="text-center font-headline-md text-on-surface-variant">
            Nuestra colección está en preparación. Vuelve pronto.
          </p>
        </section>
      )}
    </main>
  );
}
