import ProductForm from "./ProductForm";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  has_sizes: boolean | null;
  is_active: boolean;
  created_at: string;
};

async function getProducts(): Promise<ProductRow[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, category, has_sizes, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("No fue posible obtener los productos del panel.", error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error("No fue posible obtener los productos del panel.", error);
    return [];
  }
}

function formatPrice(priceInCents: number): string {
  const amount = Math.max(0, priceInCents) / 100;
  const formattedAmount = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `$${formattedAmount} MXN`;
}

export default async function AdminProductosPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-background px-container-margin py-section-gap text-on-background">
      <div className="flex flex-col gap-8 border-b border-primary pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label-caps text-on-surface-variant">ADMIN / ADA</p>
          <h1 className="mt-3 font-headline-lg text-primary">Productos</h1>
          <p className="mt-4 max-w-2xl font-body-md text-on-surface-variant">
            Administra el catálogo real de ADA. Los precios se guardan en centavos
            y las imágenes se registran en el bucket público de Supabase.
          </p>
        </div>

        <ProductForm />
      </div>

      <div className="mt-12 overflow-x-auto border border-primary">
        <table className="min-w-full text-left">
          <thead className="bg-primary text-on-primary">
            <tr>
              <th className="px-5 py-4 font-label-caps">Producto</th>
              <th className="px-5 py-4 font-label-caps">Categoría</th>
              <th className="px-5 py-4 font-label-caps">Precio</th>
              <th className="px-5 py-4 font-label-caps">Tallas</th>
              <th className="px-5 py-4 font-label-caps">Estado</th>
              <th className="px-5 py-4 font-label-caps">Creado</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-primary/20 font-body-md text-primary"
                >
                  <td className="px-5 py-4">
                    <p className="font-label-caps text-primary">
                      {product.name.toUpperCase()}
                    </p>
                    {product.description ? (
                      <p className="mt-1 max-w-xl text-on-surface-variant">
                        {product.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 font-label-caps text-on-surface-variant">
                    {product.category?.toUpperCase() ?? "ADA"}
                  </td>
                  <td className="px-5 py-4 font-label-caps text-primary">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-5 py-4 font-label-caps text-on-surface-variant">
                    {product.has_sizes ? "SÍ" : "NO"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        product.is_active
                          ? "border border-primary px-3 py-1 font-label-caps text-primary"
                          : "border border-outline px-3 py-1 font-label-caps text-outline"
                      }
                    >
                      {product.is_active ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-label-caps text-on-surface-variant">
                    {new Intl.DateTimeFormat("es-MX", {
                      dateStyle: "medium",
                    }).format(new Date(product.created_at))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center font-headline-md text-on-surface-variant">
                  No hay productos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
