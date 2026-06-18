// src/app/admin/pedidos/page.tsx
import { createSupabaseAdminClient } from "@/lib/supabase-admin"; // Ruta corregida con guion
import { revalidatePath } from "next/cache";
import StatusSelect from "./StatusSelect";

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

/**
 * SERVER ACTION: Ejecutada de forma segura en el servidor.
 */
async function updateOrderStatusAction(formData: FormData) {
  "use server";

  const orderId = formData.get("orderId") as string;
  const newStatus = formData.get("status") as OrderStatus;

  if (!orderId || !newStatus) return;

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) {
    console.error(`Error actualizando orden ${orderId}:`, error.message);
    return;
  }

  revalidatePath("/admin/pedidos");
}

/**
 * SERVER COMPONENT PRINCIPAL
 */
export default async function AdminPedidosPage() {
  const supabase = createSupabaseAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="bg-background py-8 px-6 text-primary border border-primary">
        <p className="font-label-caps text-red-500">Error al cargar las órdenes</p>
        <p className="text-on-surface-variant text-sm mt-2">{error.message}</p>
      </div>
    );
  }

  const formatMXN = (amountInCents: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amountInCents / 100);
  };

  return (
    <div className="bg-background min-h-screen py-8 px-6 text-primary font-sans selection:bg-primary selection:text-background">
      <header className="border-b border-primary pb-6 mb-8">
        <h1 className="font-headline-lg tracking-wider text-primary uppercase font-light">
          Panel de Administración
        </h1>
        <p className="font-label-caps text-on-surface-variant text-xs mt-1 tracking-widest">
          Gestión de Pedidos / ADA Sincronización Real
        </p>
      </header>

      {(!orders || orders.length === 0) ? (
        <div className="py-12 border border-primary text-center">
          <p className="font-label-caps text-on-surface-variant tracking-wider">
            No se han encontrado pedidos registrados en el sistema.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-primary">
                <th className="font-label-caps py-4 px-4 text-xs tracking-widest text-primary font-medium">
                  ID ÓRDEN
                </th>
                <th className="font-label-caps py-4 px-4 text-xs tracking-widest text-primary font-medium">
                  CLIENTE
                </th>
                <th className="font-label-caps py-4 px-4 text-xs tracking-widest text-primary font-medium">
                  FECHA
                </th>
                <th className="font-label-caps py-4 px-4 text-xs tracking-widest text-primary font-medium">
                  TOTAL
                </th>
                <th className="font-label-caps py-4 px-4 text-xs tracking-widest text-primary font-medium text-right">
                  ESTADO / ACCIÓN
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const orderDate = new Date(order.created_at).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr
                    key={order.id}
                    className="border-b border-primary/20 hover:bg-primary/5 transition-colors"
                  >
                    <td className="py-4 px-4 font-mono text-xs text-primary tracking-tight">
                      {order.id.slice(0, 8)}...
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-primary font-normal text-sm">{order.full_name}</div>
                      <div className="text-on-surface-variant text-xs font-mono">{order.email}</div>
                    </td>

                    <td className="py-4 px-4 text-on-surface-variant text-xs font-light">
                      {orderDate}
                    </td>

                    <td className="py-4 px-4 text-primary font-medium text-sm">
                      {formatMXN(order.total)}
                    </td>

                    <td className="py-4 px-4 text-right">
                      {/* Invocamos el componente interactivo de cliente pasándole los datos necesarios */}
                      <StatusSelect
                        orderId={order.id}
                        currentStatus={order.status as OrderStatus}
                        updateAction={updateOrderStatusAction}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}