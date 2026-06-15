"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useCart, type CartItem } from "@/context/CartContext";

export type ProductDetailImage = {
  id: string;
  product_id: string;
  image_url: string;
  image_alt: string | null;
  sort_order: number | null;
};

export type ProductDetailVariant = {
  id: string;
  product_id: string;
  size: string;
  stock: number;
};

export type ProductDetailData = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  images: ProductDetailImage[];
  variants: ProductDetailVariant[];
};

type CartApiProducto = {
  id: string;
  nombre: string;
  precio: number;
  categoria: string | null;
};

type CartApiVariante = {
  id: string;
  talla: string;
  stock: number;
};

type CartApiItem = {
  id: string;
  producto: CartApiProducto;
  variante: CartApiVariante | null;
  cantidad: number;
  subtotal: number;
};

type CartApiData = {
  id: string | null;
  items: CartApiItem[];
  cantidad_total: number;
  subtotal: number;
  total: number;
};

type CartApiResponse =
  | { ok: true; mensaje: string; datos: CartApiData }
  | { ok: false; error: { mensaje: string } };

type ProductDetailClientProps = {
  product: ProductDetailData;
};

function formatPrice(priceInCents: number): string {
  const amount = Math.max(0, priceInCents) / 100;
  const formattedAmount = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `$${formattedAmount} MXN`;
}

function mapCartItemsToContext(
  cartId: string | null,
  items: CartApiItem[],
): CartItem[] {
  return items.map((item) => ({
    id: item.id,
    cartId: cartId ?? "pending",
    productId: item.producto.id,
    variantId: item.variante?.id ?? null,
    quantity: item.cantidad,
    product: {
      id: item.producto.id,
      name: item.producto.nombre,
      price: item.producto.precio,
    },
    variant: item.variante
      ? {
          id: item.variante.id,
          size: item.variante.talla,
          stock: item.variante.stock,
        }
      : null,
  }));
}

function ProductImage({
  image,
  className,
}: {
  image: ProductDetailImage;
  className?: string;
}) {
  return (
    <Image
      src={image.image_url}
      alt={image.image_alt ?? "Imagen de producto ADA"}
      fill
      sizes="(max-width: 768px) 100vw, 60vw"
      className={`object-cover grayscale transition-all duration-700 hover:grayscale-0 ${className ?? ""}`}
      unoptimized
    />
  );
}

function ThumbnailButton({
  image,
  index,
  isActive,
  onSelect,
}: {
  image: ProductDetailImage;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      className={
        isActive
          ? "relative aspect-[3/4] overflow-hidden border-2 border-primary grayscale-0"
          : "relative aspect-[3/4] overflow-hidden border-2 border-transparent grayscale transition-all duration-700 hover:grayscale-0"
      }
      aria-label={`Ver imagen ${index + 1} de ${image.image_alt ?? "producto"}`}
      aria-pressed={isActive}
    >
      <ProductImage image={image} />
    </button>
  );
}

function SizeButton({
  variant,
  isSelected,
  onSelect,
}: {
  variant: ProductDetailVariant;
  isSelected: boolean;
  onSelect: (variant: ProductDetailVariant) => void;
}) {
  const isOutOfStock = variant.stock <= 0;

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      onClick={() => onSelect(variant)}
      className={
        isOutOfStock
          ? "relative flex h-12 w-12 items-center justify-center border border-outline bg-surface-container text-outline disabled:cursor-not-allowed"
          : isSelected
            ? "flex h-12 w-12 items-center justify-center bg-primary text-on-primary"
            : "flex h-12 w-12 items-center justify-center border border-primary bg-background text-primary transition-all hover:border-primary hover:bg-primary hover:text-on-primary"
      }
      aria-pressed={isSelected}
      aria-label={
        isOutOfStock
          ? `Talla ${variant.size} agotada`
          : `Seleccionar talla ${variant.size}`
      }
    >
      <span>{variant.size}</span>
      {isOutOfStock ? (
        <span
          className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -rotate-45 bg-outline"
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}

function InfoAccordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-y border-primary/20">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex w-full items-center justify-between gap-6 py-5 font-label-caps text-primary"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span className="text-xl leading-none">{isOpen ? "-" : "+"}</span>
      </button>

      {isOpen ? (
        <div className="pb-5 font-body-md text-on-surface-variant">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  const { refreshCart } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [cartPulse, setCartPulse] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const activeImage = product.images[activeImageIndex] ?? product.images[0];
  const selectedVariant = useMemo(
    () =>
      product.variants.find((variant) => variant.size === selectedSize) ?? null,
    [product.variants, selectedSize],
  );
  const canAddToCart = Boolean(selectedVariant && selectedVariant.stock > 0);

  async function handleAddToCart() {
    if (!selectedVariant || selectedVariant.stock <= 0) {
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          variant_id: selectedVariant.id,
          quantity: 1,
        }),
      });

      const result = (await response.json()) as CartApiResponse;

      if (!response.ok || !result.ok) {
        toast.error(
          result.ok ? result.mensaje : "No fue posible agregar la prenda.",
        );
        return;
      }

      const cartResponse = await fetch("/api/cart", { cache: "no-store" });
      const cartResult = (await cartResponse.json()) as CartApiResponse;

      if (cartResponse.ok && cartResult.ok) {
        refreshCart(
          mapCartItemsToContext(cartResult.datos.id, cartResult.datos.items),
        );
      }

      toast.success("Añadido a tu bolsa");
      setCartPulse(true);
      window.setTimeout(() => setCartPulse(false), 900);
    } catch {
      toast.error("No fue posible agregar la prenda.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <main className="px-container-margin py-section-gap">
      <div className="grid gap-16 lg:grid-cols-[3fr_2fr]">
        <section className="min-w-0" aria-label="Galería del producto">
          <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-high">
            {activeImage ? <ProductImage image={activeImage} /> : null}
          </div>

          {product.images.length > 1 ? (
            <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-4">
              {product.images.map((image, index) => (
                <ThumbnailButton
                  key={image.id}
                  image={image}
                  index={index}
                  isActive={index === activeImageIndex}
                  onSelect={setActiveImageIndex}
                />
              ))}
            </div>
          ) : null}
        </section>

        <aside className="md:sticky md:top-[80px] md:self-start">
          <p className="font-label-caps text-on-surface-variant">
            {product.category?.toUpperCase() ?? "ADA"}
          </p>
          <h1 className="mt-2 font-headline-lg text-primary">
            {product.name}
          </h1>
          <p className="mt-1 font-body-lg text-primary">
            {formatPrice(product.price)}
          </p>

          {product.description ? (
            <p className="mt-6 max-w-xl font-body-md text-on-surface-variant">
              {product.description}
            </p>
          ) : null}

          <div className="mt-10">
            <p className="mb-4 font-label-caps text-on-surface-variant">
              Talla
            </p>
            <div className="flex flex-wrap gap-3">
              {product.variants.map((variant) => (
                <SizeButton
                  key={variant.id}
                  variant={variant}
                  isSelected={variant.size === selectedSize}
                  onSelect={(nextVariant) => setSelectedSize(nextVariant.size)}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!canAddToCart || isAdding}
            onClick={handleAddToCart}
            aria-busy={isAdding}
            className={
              canAddToCart && !isAdding
                ? `mt-10 w-full bg-neon-lime py-5 font-label-caps tracking-widest text-primary transition-all hover:opacity-90 ${cartPulse ? "scale-[0.99]" : ""}`
                : "mt-10 w-full cursor-not-allowed bg-surface-container py-5 font-label-caps tracking-widest text-outline"
            }
          >
            {canAddToCart ? "AGREGAR AL CARRITO" : "SELECCIONA UNA TALLA"}
          </button>

          <div className="mt-14">
            <InfoAccordion title="COMPOSICIÓN Y CUIDADOS">
              Microfibra de alta compresión, lavado en frío.
            </InfoAccordion>
            <InfoAccordion title="ENVÍOS Y DEVOLUCIONES">
              Envío gratis en órdenes mayores a $1,200 MXN. Devoluciones gratis
              dentro de los primeros 15 días.
            </InfoAccordion>
          </div>
        </aside>
      </div>
    </main>
  );
}
