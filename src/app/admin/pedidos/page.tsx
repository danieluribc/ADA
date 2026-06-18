// src/app/admin/pedidos/page.tsx
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import AdminHeader from "@/components/admin/AdminHeader";
import StatusSelect from "./StatusSelect";

export const dynamic = "force-dynamic";

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

async function updateOrderStatusAction(formData: FormData) {
  "use server";
  const orderId = formData.get("orderId") as string;
  const newStatus = formData.get("status") as OrderStatus;
  const supabase = createSupabaseAdminClient();
  await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
  revalidatePath("/admin/pedidos");
}

export default async function AdminPedidosPage() {
  const supabase = createSupabaseAdminClient();

  // Ejecutamos la consulta pura
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const formatMXN = (amountInCents: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amountInCents / 100);
  };

  return (
    <div className="bg-background min-h-screen py-8 px-6 text-primary font-sans">
      <AdminHeader
        title="Gestión de Pedidos"
        subtitle="ADA / Sincronización Real de Órdenes"
      />

      {(!orders || orders.length === 0) ? (
        <div className="py-12 border border-primary text-center">
          <p className="font-label-caps text-on-surface-variant tracking-wider">
            No se han encontrado pedidos registrados en el sistema.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-primary">
            <thead>
              <tr className="border-b border-primary bg-primary/10">
                <th className="font-label-caps py-4 px-4 text-xs tracking-widest text-primary font-medium">ID ÓRDEN</th>
                <th className="font-label-caps py-4 px-4 text-xs tracking-widest text-primary font-medium">CLIENTE</th>
                <th className="font-label-caps py-4 px-4 text-xs tracking-widest text-primary font-medium">FECHA</th>
                <th className="font-label-caps py-4 px-4 text-xs tracking-widest text-primary font-medium">TOTAL</th>
                <th className="font-label-caps py-4 px-4 text-xs tracking-widest text-primary font-medium text-right">ESTADO / ACCIÓN</th>
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
                  <tr key={order.id} className="border-b border-primary/20 hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-primary">{order.id.slice(0, 8)}...</td>
                    <td className="py-4 px-4">
                      <div className="text-primary font-normal text-sm">{order.full_name || "Sin nombre"}</div>
                      <div className="text-on-surface-variant text-xs font-mono">{order.email}</div>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant text-xs font-light">{orderDate}</td>
                    <td className="py-4 px-4 text-primary font-medium text-sm">{formatMXN(order.total)}</td>
                    <td className="py-4 px-4 text-right">
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