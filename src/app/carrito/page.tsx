"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useCart, type CartItem } from "@/context/CartContext";

const FREE_SHIPPING_THRESHOLD = 120000;
const SHIPPING_FEE = 15000;

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

type CartApiImagen = {
  url: string | null;
  texto_alt: string | null;
};

type CartApiItem = {
  id: string;
  producto: CartApiProducto;
  variante: CartApiVariante | null;
  imagen: CartApiImagen | null;
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

type CartPageItem = CartApiItem & {
  imagen_url: string;
  imagen_alt: string | null;
};

function formatMoney(cents: number): string {
  const amount = Math.max(0, cents) / 100;
  const formattedAmount = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `$${formattedAmount} MXN`;
}

function normalizeCartItems(items: CartApiItem[]): CartPageItem[] {
  return items.map((item) => ({
    ...item,
    imagen_url: item.imagen?.url ?? "",
    imagen_alt: item.imagen?.texto_alt ?? null,
  }));
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

function CartItemImage({ item }: { item: CartPageItem }) {
  if (!item.imagen_url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest text-primary">
        <span className="font-display-xl text-5xl tracking-tighter text-primary/20">
          ADA
        </span>
      </div>
    );
  }

  return (
    <Image
      src={item.imagen_url}
      alt={item.imagen_alt ?? item.producto.nombre}
      fill
      sizes="(max-width: 768px) 180px, 220px"
      className="object-cover grayscale transition-all duration-700 hover:grayscale-0"
      unoptimized
    />
  );
}

function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onDelete,
}: {
  item: CartPageItem;
  onIncrement: (cartItemId: string) => void;
  onDecrement: (cartItemId: string) => void;
  onDelete: (cartItemId: string) => void;
}) {
  return (
    <article className="grid grid-cols-[160px_minmax(0,1fr)] gap-6 border-y border-primary/15 py-6 md:grid-cols-[220px_minmax(0,1fr)]">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-high">
        <CartItemImage item={item} />
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-6">
        <div>
          <p className="font-label-caps text-on-surface-variant">
            {item.producto.categoria?.toUpperCase() ?? "ADA"}
          </p>
          <h2 className="mt-2 font-headline-md text-primary">
            {item.producto.nombre.toUpperCase()}
          </h2>
          <p className="mt-2 font-label-caps text-[10px] text-on-surface-variant tracking-widest">
            TALLA {item.variante?.talla.toUpperCase() ?? "SIN TALLA"}
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 font-label-caps text-on-surface-variant">
              Cantidad
            </p>
            <div className="flex items-center border border-primary">
              <button
                type="button"
                onClick={() => onDecrement(item.id)}
                disabled={item.cantidad <= 1}
                className="flex h-11 w-12 items-center justify-center text-primary transition-all hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Disminuir cantidad"
              >
                −
              </button>
              <span className="min-w-12 border-x border-primary px-4 py-3 text-center font-label-caps text-primary">
                {item.cantidad}
              </span>
              <button
                type="button"
                onClick={() => onIncrement(item.id)}
                className="flex h-11 w-12 items-center justify-center text-primary transition-all hover:bg-primary hover:text-on-primary"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 sm:items-end">
            <p className="font-body-lg text-primary">
              {formatMoney(item.subtotal)}
            </p>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="border-b border-primary/40 pb-1 font-label-caps text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function OrderSummary({
  subtotal,
}: {
  subtotal: number;
}) {
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  return (
    <aside className="border-y border-primary py-8 md:sticky md:top-[80px] md:self-start">
      <p className="font-label-caps text-on-surface-variant">
        RESUMEN DE COMPRA
      </p>

      <div className="mt-8 space-y-5 font-body-md text-on-surface-variant">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="text-primary">{formatMoney(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Envío</span>
          <span className="text-primary">
            {shipping === 0 ? "GRATIS" : formatMoney(shipping)}
          </span>
        </div>
        <div className="border-t border-primary pt-5 text-lg font-headline-md text-primary">
          <div className="flex items-center justify-between">
            <span>TOTAL</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      <p className="mt-6 font-link-sm text-on-surface-variant">
        Envío gratis en órdenes iguales o mayores a {formatMoney(FREE_SHIPPING_THRESHOLD)}.
      </p>

      <Link
        href="/checkout"
        className="mt-8 flex w-full items-center justify-center bg-primary py-5 font-label-caps tracking-widest text-on-primary transition-all hover:bg-neon-lime hover:text-primary"
      >
        FINALIZAR COMPRA
      </Link>
    </aside>
  );
}

export default function CartPage() {
  const { refreshCart } = useCart();
  const refreshCartRef = useRef(refreshCart);
  const [items, setItems] = useState<CartPageItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshCartRef.current = refreshCart;
  }, [refreshCart]);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const result = (await response.json()) as CartApiResponse;

      if (!response.ok || !result.ok) {
        throw new Error(
          result.ok ? result.mensaje : "No fue posible cargar tu bolsa.",
        );
      }

      const nextItems = normalizeCartItems(result.datos.items);

      setItems(nextItems);
      setSubtotal(result.datos.subtotal);
      refreshCartRef.current(mapCartItemsToContext(result.datos.id, result.datos.items));
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No fue posible cargar tu bolsa.";

      setError(message);
      setItems([]);
      setSubtotal(0);
      refreshCartRef.current([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function fetchCart() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        const result = (await response.json()) as CartApiResponse;

        if (!response.ok || !result.ok) {
          throw new Error(
            result.ok ? result.mensaje : "No fue posible cargar tu bolsa.",
          );
        }

        if (!isActive) {
          return;
        }

        const nextItems = normalizeCartItems(result.datos.items);

        setItems(nextItems);
        setSubtotal(result.datos.subtotal);
        refreshCartRef.current(mapCartItemsToContext(result.datos.id, result.datos.items));
      } catch (caughtError) {
        if (!isActive) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No fue posible cargar tu bolsa.";

        setError(message);
        setItems([]);
        setSubtotal(0);
        refreshCartRef.current([]);
        toast.error(message);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void fetchCart();

    return () => {
      isActive = false;
    };
  }, []);

  const totalQuantity = useMemo(
    () => items.reduce((total, item) => total + item.cantidad, 0),
    [items],
  );

  async function updateQuantity(cartItemId: string, nextQuantity: number) {
    if (nextQuantity < 1) {
      return;
    }

    const response = await fetch("/api/cart", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cart_item_id: cartItemId,
        quantity: nextQuantity,
      }),
    });
    const result = (await response.json()) as CartApiResponse;

    if (!response.ok || !result.ok) {
      toast.error(
        result.ok ? result.mensaje : "No fue posible actualizar la cantidad.",
      );
      await loadCart();
      return;
    }

    await loadCart();
  }

  async function deleteItem(cartItemId: string) {
    const response = await fetch(
      `/api/cart?cart_item_id=${encodeURIComponent(cartItemId)}`,
      {
        method: "DELETE",
      },
    );
    const result = (await response.json()) as CartApiResponse;

    if (!response.ok || !result.ok) {
      toast.error(
        result.ok ? result.mensaje : "No fue posible eliminar el item.",
      );
      await loadCart();
      return;
    }

    await loadCart();
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-container-margin py-section-gap">
        <p className="font-label-caps text-on-surface-variant">
          Cargando tu bolsa...
        </p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-container-margin py-section-gap">
        <p className="font-label-caps text-outline">BOLSA ADA</p>
        <h1 className="mt-5 text-center font-headline-lg text-primary">
          TU BOLSA ESTÁ VACÍA
        </h1>
        <Link
          href="/tienda"
          className="mt-8 border border-primary px-8 py-4 font-label-caps text-primary transition-all hover:bg-primary hover:text-on-primary"
        >
          VOLVER A LA TIENDA
        </Link>
      </main>
    );
  }

  return (
    <main className="px-container-margin py-section-gap">
      <div className="flex flex-col gap-3 border-b border-primary pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label-caps text-on-surface-variant">BOLSA ADA</p>
          <h1 className="mt-2 font-headline-lg text-primary">TU BOLSA</h1>
        </div>
        <p className="font-label-caps text-on-surface-variant">
          {totalQuantity} PRENDA{totalQuantity === 1 ? "" : "S"}
        </p>
      </div>

      {error ? (
        <div className="mt-8 border border-error p-5 font-body-md text-error">
          {error}
          <button
            type="button"
            onClick={() => void loadCart()}
            className="ml-4 border-b border-error font-label-caps"
          >
            REINTENTAR
          </button>
        </div>
      ) : null}

      <div className="mt-12 grid gap-12 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Productos en tu bolsa">
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onIncrement={(cartItemId) => {
                const current = items.find((entry) => entry.id === cartItemId);
                void updateQuantity(cartItemId, (current?.cantidad ?? 0) + 1);
              }}
              onDecrement={(cartItemId) => {
                const current = items.find((entry) => entry.id === cartItemId);
                void updateQuantity(cartItemId, (current?.cantidad ?? 0) - 1);
              }}
              onDelete={deleteItem}
            />
          ))}
        </section>

        <OrderSummary subtotal={subtotal} />
      </div>
    </main>
  );
}
