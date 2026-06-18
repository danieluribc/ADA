"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { deleteProduct, updateProductActive } from "./actions";
import ProductForm from "./ProductForm";

type ProductActionRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  has_sizes: boolean | null;
  is_active: boolean;
};

type ProductActionsCellProps = {
  product: ProductActionRow;
};

export default function ProductActionsCell({ product }: ProductActionsCellProps) {
  const [isPending, setIsPending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  async function handleToggleActive() {
    setIsPending(true);
    try {
      const res = await updateProductActive(product.id, !product.is_active);
      if (res.ok) toast.success("Estado actualizado");
      else toast.error(res.message);
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Seguro que deseas eliminar esta prenda permanentemente?")) return;
    setIsPending(true);
    try {
      const res = await deleteProduct(product.id);
      if (res.ok) toast.success("Producto eliminado");
      else toast.error(res.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <td className="px-5 py-4 text-right">
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={isPending}
          className="text-xs font-label-caps border border-primary px-3 py-1 text-primary transition-all hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {product.is_active ? "DESACTIVAR" : "ACTIVAR"}
        </button>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          disabled={isPending}
          className="text-xs font-label-caps border border-primary bg-primary px-3 py-1 text-on-primary transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          EDITAR
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-label-caps border border-error px-3 py-1 text-error transition-all hover:bg-error hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          ELIMINAR
        </button>
      </div>

      {isEditing && (
        <ProductForm
          triggerMode="edit"
          product={{
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            has_sizes: product.has_sizes,
          }}
          onCloseEdit={() => setIsEditing(false)}
        />
      )}
    </td>
  );
}
