import ProductFilters, { type ProductFiltersProduct } from "@/components/ProductFilters";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type ProductRow = ProductFiltersProduct & {
  description: string | null;
  has_sizes: boolean | null;
  is_active: boolean;
};

const MOCK_PRODUCTS: ProductRow[] = [
  {
    id: "mock-top-signal",
    name: "Top Signal",
    description: "Top deportivo de soporte medio con líneas limpias.",
    price: 125000,
    category: "TOPS",
    has_sizes: true,
    is_active: true,
    image_url: createMockProductImage("TOPS"),
  },
  {
    id: "mock-leggings-core",
    name: "Leggings Core",
    description: "Legging de cintura alta con compresión suave.",
    price: 168000,
    category: "LEGGINGS",
    has_sizes: true,
    is_active: true,
    image_url: createMockProductImage("LEGGINGS"),
  },
  {
    id: "mock-short-metro",
    name: "Short Metro",
    description: "Short ligero para entrenamiento urbano y descanso activo.",
    price: 139000,
    category: "BOTTOMS",
    has_sizes: true,
    is_active: true,
    image_url: createMockProductImage("BOTTOMS"),
  },
  {
    id: "mock-bra-arc",
    name: "Bra Arc",
    description: "Sujetador deportivo minimalista de secado rápido.",
    price: 112000,
    category: "TOPS",
    has_sizes: true,
    is_active: true,
    image_url: createMockProductImage("TOPS"),
  },
  {
    id: "mock-bolso-ada",
    name: "Bolso ADA",
    description: "Bolso compacto para llevar lo esencial del día.",
    price: 89000,
    category: "ACCESORIOS",
    has_sizes: false,
    is_active: true,
    image_url: createMockProductImage("ACCESORIOS"),
  },
  {
    id: "mock-chaqueta-linea",
    name: "Chaqueta Línea",
    description: "Capa exterior ligera con silueta editorial.",
    price: 214000,
    category: "OUTERWEAR",
    has_sizes: true,
    is_active: true,
    image_url: createMockProductImage("OUTERWEAR"),
  },
];

async function getProducts(): Promise<ProductRow[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, category, has_sizes, is_active, image_url")
      .eq("is_active", true);

    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS;
    }

    return data;
  } catch (error) {
    console.error("No fue posible obtener los productos de ADA.", error);
    return MOCK_PRODUCTS;
  }
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

function createMockProductImage(category: string): string {
  const label = category.toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200">
      <rect width="900" height="1200" fill="#eeeeee"/>
      <rect x="0" y="0" width="900" height="1200" fill="none" stroke="#000000" stroke-width="2"/>
      <path d="M120 1020 C260 860 340 1020 460 860 S690 760 780 900" fill="none" stroke="#000000" stroke-width="3"/>
      <text x="60" y="110" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="700" letter-spacing="10">${label}</text>
      <text x="60" y="160" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="400" letter-spacing="4">ADA / SPORTSWEAR</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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

      <ProductFilters products={products} categories={categories} />
    </main>
  );
}
