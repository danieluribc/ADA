// src/app/admin/pedidos/StatusSelect.tsx
'use client';

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_LABELS: Record<OrderStatus, string> = {
    pending: "PENDIENTE",
    paid: "PAGADO",
    shipped: "ENVIADO",
    delivered: "ENTREGADO",
    cancelled: "CANCELADO",
};

interface StatusSelectProps {
    orderId: string;
    currentStatus: OrderStatus;
    // Pasamos la acción de servidor de forma segura como un prop
    updateAction: (formData: FormData) => Promise<void>;
}

export default function StatusSelect({ orderId, currentStatus, updateAction }: StatusSelectProps) {
    return (
        <form action={updateAction} className="inline-block">
            <input type="hidden" name="orderId" value={orderId} />

            <select
                name="status"
                defaultValue={currentStatus}
                onChange={(e) => e.target.form?.requestSubmit()}
                className="border border-primary bg-background text-primary px-3 py-1.5 font-label-caps text-xs tracking-wider focus:outline-none cursor-pointer transition-all duration-150 uppercase"
            >
                <option value="pending">{STATUS_LABELS.pending}</option>
                <option value="paid">{STATUS_LABELS.paid}</option>
                <option value="shipped">{STATUS_LABELS.shipped}</option>
                <option value="delivered">{STATUS_LABELS.delivered}</option>
                <option value="cancelled">{STATUS_LABELS.cancelled}</option>
            </select>
        </form>
    );
}