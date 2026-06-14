import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  has_sizes: boolean | null;
  is_active: boolean;
};

const MOCK_PRODUCTS: ProductRow[] = [
  {
    id: "mock-top-deportivo-cero",
    name: "Top Deportivo Cero",
    description: "Soporte ligero para entrenamientos de alta intensidad.",
    price: 125000,
    category: "TOPS",
    has_sizes: true,
    is_active: true,
  },
  {
    id: "mock-leggings-estudio",
    name: "Leggings Estudio",
    description: "Silueta limpia con compresión suave y acabado premium.",
    price: 168000,
    category: "BOTTOMS",
    has_sizes: true,
    is_active: true,
  },
  {
    id: "mock-chaqueta-cortavientos",
    name: "Chaqueta Cortavientos",
    description: "Capa exterior minimalista para movimiento urbano.",
    price: 214000,
    category: "OUTERWEAR",
    has_sizes: true,
    is_active: true,
  },
];

async function getFeaturedProducts(): Promise<ProductRow[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, category, has_sizes, is_active")
      .eq("is_active", true)
      .limit(3);

    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS;
    }

    return data.slice(0, 3);
  } catch (error) {
    console.error("No fue posible obtener los productos destacados de ADA.", error);
    return MOCK_PRODUCTS;
  }
}

function formatPrice(priceInCents: number): string {
  const amount = Math.max(0, priceInCents) / 100;
  const formattedAmount = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `$${formattedAmount} MXN`;
}

function ProductCard({ product }: { product: ProductRow }) {
  return (
    <Link href={`/productos/${product.id}`} className="group">
      <div className="aspect-[3/4] overflow-hidden bg-surface-container-high grayscale transition-all duration-700 group-hover:grayscale-0">
        <div className="h-full w-full bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest transition-transform duration-700 group-hover:scale-105" />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-body-md text-primary">{product.name}</p>
          <p className="mt-1 font-label-caps text-on-surface-variant tracking-widest">
            {product.category ?? "ADA"}
          </p>
        </div>

        <p className="font-label-caps text-primary whitespace-nowrap">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <>
      <style>
        {`
          @keyframes ada-marquee {
            to {
              transform: translateX(-50%);
            }
          }

          .ada-marquee-track {
            animation: ada-marquee 28s linear infinite;
          }
        `}
      </style>

      <section className="relative min-h-[calc(100vh-73px)] overflow-hidden bg-primary px-container-margin py-section-gap">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(255,255,255,0.14),transparent_34%),linear-gradient(135deg,#151515_0%,#050505_100%)]" />

        <div className="relative z-10 flex min-h-[calc(100vh-73px)] items-center">
          <div className="max-w-5xl">
            <p className="mb-6 font-label-caps text-on-primary/70">
              ADA / SPORTSWEAR 2026
            </p>
            <h1 className="font-display-xl text-on-primary">MOVIMIENTO CON ESTILO</h1>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/tienda"
                className="bg-neon-lime px-8 py-4 font-label-caps text-primary transition-all hover:opacity-90"
              >
                VER COLECCIÓN
              </Link>
              <Link
                href="/coleccion"
                className="border border-on-primary px-8 py-4 font-label-caps text-on-primary transition-all hover:bg-on-primary hover:text-primary"
              >
                VER CAMPAÑA
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-container-margin py-section-gap">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <p className="font-label-caps text-outline">ESTABLECIDA 2026</p>
          <p className="max-w-4xl font-headline-lg text-primary">
            Prendas deportivas diseñadas para la mujer que se mueve. Comodidad,
            estilo y calidad en cada costura.
          </p>
        </div>
      </section>

      <section className="px-container-margin py-section-gap">
        <div className="mb-10">
          <p className="font-label-caps text-outline">SELECCIÓN INICIAL</p>
          <h2 className="mt-3 font-headline-md text-primary">Productos Destacados</h2>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-20 text-center font-headline-md text-on-surface-variant">
            Próximamente: colección deportiva ADA.
          </p>
        )}
      </section>

      <section className="overflow-hidden bg-primary py-3 text-on-primary" aria-label="Nueva colección">
        <div className="ada-marquee-track flex w-max">
          <span className="pr-12 font-label-caps">
            NUEVA COLECCIÓN · NUEVA COLECCIÓN · NUEVA COLECCIÓN
          </span>
          <span className="pr-12 font-label-caps" aria-hidden="true">
            NUEVA COLECCIÓN · NUEVA COLECCIÓN · NUEVA COLECCIÓN
          </span>
        </div>
      </section>

      <section className="px-container-margin py-section-gap">
        <div className="border-b border-primary pb-12">
          <p className="font-label-caps text-outline">NEWSLETTER</p>
          <h2 className="mt-4 max-w-3xl font-headline-lg text-primary">
            Recibe la colección antes que nadie.
          </h2>

          <form
            className="mt-10 flex max-w-2xl flex-col gap-6 md:flex-row md:items-end"
            action="/newsletter"
            method="post"
          >
            <label htmlFor="email" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
              className="min-h-12 flex-1 bg-transparent text-base text-primary outline-none placeholder:text-outline"
            />
            <button
              type="submit"
              className="bg-primary px-8 py-4 font-label-caps text-on-primary transition-all hover:bg-neon-lime hover:text-primary"
            >
              SUSCRIBIRME
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
