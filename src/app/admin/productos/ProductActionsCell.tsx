"use client";

import { Power, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { deleteProduct, updateProductActive, type ProductActionResult } from "./actions";

type ProductActionsCellProps = {
  productId: string;
  isActive: boolean;
};

export default function ProductActionsCell({ productId, isActive }: ProductActionsCellProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function refreshAfterResult(result: ProductActionResult, successMessage: string) {
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(successMessage);
    router.refresh();
  }

  async function handleToggleActive() {
    setIsToggling(true);

    const result = await updateProductActive(productId, !isActive);

    refreshAfterResult(
      result,
      isActive ? "Producto desactivado correctamente." : "Producto activado correctamente.",
    );

    setIsToggling(false);
  }

  async function handleDelete() {
    const shouldDelete = window.confirm(
      "¿Eliminar este producto? Esta acción no se puede deshacer.",
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);

    const result = await deleteProduct(productId);

    refreshAfterResult(result, "Producto eliminado correctamente.");

    setIsDeleting(false);
  }

  return (
    <td className="px-5 py-4">
      <div className="flex items-center gap-4 font-label-caps text-primary">
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={isToggling || isDeleting}
          className="flex items-center gap-2 text-on-surface-variant transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={isActive ? "Desactivar producto" : "Activar producto"}
        >
          <Power className="h-4 w-4" aria-hidden="true" />
          {isToggling ? "..." : isActive ? "Desactivar" : "Activar"}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 text-error transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Eliminar producto"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {isDeleting ? "..." : "Eliminar"}
        </button>
      </div>
    </td>
  );
}
