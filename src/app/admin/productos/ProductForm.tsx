"use client";

import { FormEvent, useRef, useState } from "react";
import toast from "react-hot-toast";
import { createProduct, type ProductActionResult } from "./actions";

type VariantInput = {
  size: "XS" | "S" | "M" | "L" | "XL";
  stock: number;
};

const SIZES: VariantInput["size"][] = ["XS", "S", "M", "L", "XL"];

export default function ProductForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ProductActionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const imageFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );

    setFiles((currentFiles) => [...currentFiles, ...imageFiles]);
  }

  function removeFile(index: number) {
    setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  function addVariant() {
    const nextSize = SIZES.find((size) => !variants.some((variant) => variant.size === size));
    const size = nextSize ?? "XS";

    setVariants((currentVariants) => [
      ...currentVariants.filter((variant) => variant.size !== size),
      { size, stock: 0 },
    ]);
  }

  function updateVariant(index: number, patch: Partial<VariantInput>) {
    setVariants((currentVariants) =>
      currentVariants.map((variant, variantIndex) => {
        if (variantIndex !== index) {
          return variant;
        }

        return {
          ...variant,
          ...patch,
        };
      }),
    );
  }

  function removeVariant(index: number) {
    setVariants((currentVariants) =>
      currentVariants.filter((_, variantIndex) => variantIndex !== index),
    );
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

    const actionResult = await createProduct(formData);
    setResult(actionResult);
    setIsSubmitting(false);

    if (actionResult.ok) {
      toast.success("Producto guardado con éxito en Supabase");
      form.reset();
      setHasSizes(false);
      setVariants([]);
      setFiles([]);
    } else {
      toast.error(actionResult.message);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-primary px-6 py-3 font-label-caps tracking-widest text-on-primary transition-all hover:opacity-90"
      >
        AGREGAR NUEVO PRODUCTO
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-primary/20 px-container-margin py-12 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-form-title"
        >
          <div className="w-full max-w-4xl bg-background p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-6 border-b border-primary pb-6">
              <div>
                <p className="font-label-caps text-on-surface-variant">
                  PANEL ADMIN
                </p>
                <h2 id="product-form-title" className="mt-2 font-headline-md text-primary">
                  Nuevo Producto
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-label-caps text-on-surface-variant transition-colors hover:text-primary"
                aria-label="Cerrar formulario"
              >
                CERRAR
              </button>
            </div>

            {result && !result.ok ? (
              <div className="mt-6 border border-error p-4 font-body-md text-error">
                {result.message}
              </div>
            ) : null}

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="mt-8 grid gap-8"
              encType="multipart/form-data"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="font-label-caps text-on-surface-variant">
                    Nombre de la prenda
                  </span>
                  <input
                    name="name"
                    type="text"
                    required
                    className="border border-primary bg-transparent px-4 py-3 text-primary outline-none focus:border-neon-lime"
                    placeholder="Ej. Leggings Core"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="font-label-caps text-on-surface-variant">
                    Categoría
                  </span>
                  <input
                    name="category"
                    type="text"
                    required
                    className="border border-primary bg-transparent px-4 py-3 text-primary outline-none focus:border-neon-lime"
                    placeholder="Ej. Leggings"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="font-label-caps text-on-surface-variant">
                  Descripción
                </span>
                <textarea
                  name="description"
                  rows={5}
                  className="border border-primary bg-transparent px-4 py-3 text-primary outline-none resize-y focus:border-neon-lime"
                  placeholder="Describe la prenda..."
                />
              </label>

              <label className="grid gap-2 md:max-w-xs">
                <span className="font-label-caps text-on-surface-variant">
                  Precio en MXN
                </span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="border border-primary bg-transparent px-4 py-3 text-primary outline-none focus:border-neon-lime"
                  placeholder="1250.00"
                />
              </label>

              <label className="flex items-center gap-3 font-label-caps text-primary">
                <input
                  type="checkbox"
                  checked={hasSizes}
                  onChange={(event) => {
                    setHasSizes(event.target.checked);
                    if (!event.target.checked) {
                      setVariants([]);
                    }
                  }}
                  className="h-5 w-5 border border-primary"
                />
                Tiene Tallas
              </label>

              {hasSizes ? (
                <div className="grid gap-4 rounded-none border border-primary p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-label-caps text-on-surface-variant">
                      Tallas y Stock
                    </p>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="border border-primary px-4 py-2 font-label-caps text-primary transition-all hover:bg-primary hover:text-on-primary"
                    >
                      AGREGAR TALLA
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <p className="font-body-md text-on-surface-variant">
                      Agrega tallas disponibles para este producto.
                    </p>
                  ) : null}

                  <div className="grid gap-3">
                    {variants.map((variant, index) => (
                      <div
                        key={`${variant.size}-${index}`}
                        className="grid grid-cols-[1fr_1fr_auto] gap-3"
                      >
                        <select
                          value={variant.size}
                          onChange={(event) =>
                            updateVariant(index, {
                              size: event.target.value as VariantInput["size"],
                            })
                          }
                          className="border border-primary bg-transparent px-4 py-3 text-primary outline-none focus:border-neon-lime"
                        >
                          {SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={variant.stock}
                          onChange={(event) =>
                            updateVariant(index, {
                              stock: Number(event.target.value),
                            })
                          }
                          className="border border-primary bg-transparent px-4 py-3 text-primary outline-none focus:border-neon-lime"
                          placeholder="Stock"
                        />

                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="border border-primary px-4 py-3 font-label-caps text-primary transition-all hover:bg-primary hover:text-on-primary"
                        >
                          QUITAR
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3">
                <span className="font-label-caps text-on-surface-variant">
                  Imágenes
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => addFiles(event.target.files)}
                  className="hidden"
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    addFiles(event.dataTransfer.files);
                  }}
                  className="flex min-h-40 cursor-pointer flex-col items-center justify-center border border-dashed border-primary px-6 py-8 text-center font-label-caps text-on-surface-variant transition-colors hover:border-neon-lime hover:text-primary"
                >
                  Arrastra imágenes aquí o haz clic para seleccionar
                </div>

                {files.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-3 border border-primary px-3 py-2 font-link-sm text-primary"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="font-label-caps text-on-surface-variant hover:text-primary"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end border-t border-primary pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary px-8 py-4 font-label-caps tracking-widest text-on-primary transition-all hover:bg-neon-lime hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "GUARDANDO..." : "GUARDAR PRODUCTO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
