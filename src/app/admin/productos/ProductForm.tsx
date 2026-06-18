// src/app/admin/productos/ProductForm.tsx
"use client";

import { FormEvent, useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createProduct, updateProduct, type ProductActionResult } from "./actions";

type VariantInput = { size: "XS" | "S" | "M" | "L" | "XL"; stock: number };
const SIZES: VariantInput["size"][] = ["XS", "S", "M", "L", "XL"];

type ProductFormProps = {
  product?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string | null;
    has_sizes: boolean | null;
    images?: string[];
  };
  triggerMode?: "create" | "edit";
  onCloseEdit?: () => void;
};

export default function ProductForm({ product, triggerMode = "create", onCloseEdit }: ProductFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(triggerMode === "edit");
  const [hasSizes, setHasSizes] = useState(product?.has_sizes ?? false);
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ProductActionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar el estado de apertura si se activa desde el botón externo de edición
  useEffect(() => {
    if (triggerMode === "edit") setIsOpen(true);
  }, [triggerMode]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const imageFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    setFiles((currentFiles) => [...currentFiles, ...imageFiles]);
  }

  function removeFile(index: number) {
    setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("has_sizes", hasSizes ? "true" : "false");
    formData.set("variants", JSON.stringify(variants));
    files.forEach((file) => formData.append("images", file));

    // Decidir quirúrgicamente si creamos o actualizamos
    const actionResult = product?.id
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    setResult(actionResult);
    setIsSubmitting(false);

    if (actionResult.ok) {
      toast.success(product?.id ? "Producto actualizado con éxito" : "Producto guardado con éxito");
      handleClose();
    } else {
      toast.error(actionResult.message);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setFiles([]);
    if (onCloseEdit) onCloseEdit();
  }

  return (
    <>
      {triggerMode === "create" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-primary px-6 py-3 font-label-caps tracking-widest text-on-primary transition-all hover:opacity-90 cursor-pointer"
        >
          AGREGAR NUEVO PRODUCTO
        </button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-primary/20 px-container-margin py-12 backdrop-blur-sm overflow-y-auto" role="dialog">
          <div className="w-full max-w-4xl bg-background p-8 shadow-2xl my-auto border border-primary">
            <div className="flex items-start justify-between gap-6 border-b border-primary pb-6">
              <div>
                <p className="font-label-caps text-on-surface-variant">PANEL ADMIN / ADA</p>
                <h2 className="mt-2 font-headline-md text-primary">
                  {product?.id ? `Editar Prenda: ${product.name}` : "Nuevo Producto"}
                </h2>
              </div>
              <button type="button" onClick={handleClose} className="font-label-caps text-on-surface-variant hover:text-primary cursor-pointer">
                CERRAR
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="mt-8 grid gap-8" encType="multipart/form-data">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="font-label-caps text-on-surface-variant">Nombre de la prenda</span>
                  <input name="name" type="text" required defaultValue={product?.name ?? ""} className="border border-primary bg-transparent px-4 py-3 text-primary outline-none" />
                </label>

                <label className="grid gap-2">
                  <span className="font-label-caps text-on-surface-variant">Categoría</span>
                  <input name="category" type="text" required defaultValue={product?.category ?? ""} className="border border-primary bg-transparent px-4 py-3 text-primary outline-none" />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="font-label-caps text-on-surface-variant">Descripción</span>
                <textarea name="description" rows={4} defaultValue={product?.description ?? ""} className="border border-primary bg-transparent px-4 py-3 text-primary outline-none resize-y" />
              </label>

              <label className="grid gap-2 md:max-w-xs">
                <span className="font-label-caps text-on-surface-variant">Precio en MXN</span>
                <input name="price" type="number" min="0" step="0.01" required defaultValue={product?.price ? product.price / 100 : ""} className="border border-primary bg-transparent px-4 py-3 text-primary outline-none" />
              </label>

              {/* Sección de imágenes del formulario original */}
              <div className="grid gap-3">
                <span className="font-label-caps text-on-surface-variant">Añadir Nuevas Imágenes</span>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(event) => addFiles(event.target.files)} className="hidden" />
                <div onClick={() => fileInputRef.current?.click()} className="flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-primary px-4 py-4 text-center font-label-caps text-xs text-on-surface-variant hover:text-primary">
                  Arrastra imágenes o haz clic aquí
                </div>

                {/* Lista de archivos en cola */}
                {files.length > 0 && (
                  <div className="grid gap-2 grid-cols-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between border border-primary px-3 py-1 text-xs text-primary truncate">
                        <span>{file.name}</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-red-500 ml-2">X</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-primary pt-6">
                <button type="submit" disabled={isSubmitting} className="bg-primary px-8 py-4 font-label-caps tracking-widest text-on-primary hover:bg-primary/90 disabled:opacity-50 cursor-pointer">
                  {isSubmitting ? "GUARDANDO..." : product?.id ? "ACTUALIZAR PRENDA" : "GUARDAR PRODUCTO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}