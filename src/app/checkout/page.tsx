"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  cart_token: string | null;
  moneda: "MXN";
  cantidad_total: number;
  subtotal: number;
  total: number;
  items: CartApiItem[];
};

type CartApiResponse =
  | { ok: true; mensaje: string; datos: CartApiData }
  | { ok: false; error: { codigo: string; mensaje: string; detalles?: unknown } };

type CheckoutItem = {
  cart_item_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price_at_purchase: number;
};

type CheckoutRequest = {
  full_name: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
  items: CheckoutItem[];
};

type CheckoutApiResponse =
  | { ok: true; mensaje: string; datos: { order_id: string; status: string; total: number } }
  | { ok: false; error: { codigo: string; mensaje: string; detalles?: unknown } };

type CheckoutForm = {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
};

type CheckoutPageItem = CartApiItem & {
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

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function normalizeCartItems(items: CartApiItem[]): CheckoutPageItem[] {
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

function getShippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

function CheckoutProductImage({ item }: { item: CheckoutPageItem }) {
  if (!item.imagen_url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-container-high text-primary">
        <span className="font-label-caps text-primary/20">ADA</span>
      </div>
    );
  }

  return (
    <Image
      src={item.imagen_url}
      alt={item.imagen_alt ?? item.producto.nombre}
      fill
      sizes="(max-width: 1024px) 96px, 120px"
      className="object-cover grayscale"
      unoptimized
    />
  );
}

function ShippingForm({
  form,
  isSubmitting,
  onFieldChange,
}: {
  form: CheckoutForm;
  isSubmitting: boolean;
  onFieldChange: (field: keyof CheckoutForm, value: string) => void;
}) {
  return (
    <section className="min-w-0" aria-labelledby="shipping-details-title">
      <p className="font-label-caps text-on-surface-variant">DATOS DE ENVÍO</p>
      <h2 id="shipping-details-title" className="mt-3 font-headline-md text-primary">
        Completa tu información de entrega
      </h2>

      <form
        className="mt-10 grid gap-8"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label className="grid gap-3">
          <span className="font-label-caps text-on-surface-variant">
            Nombre Completo
          </span>
          <input
            value={form.fullName}
            onChange={(event) => onFieldChange("fullName", event.target.value)}
            required
            disabled={isSubmitting}
            className="border-0 border-b border-primary bg-transparent px-0 py-4 text-primary outline-none placeholder:text-outline focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Nombre completo"
            autoComplete="name"
          />
        </label>

        <label className="grid gap-3">
          <span className="font-label-caps text-on-surface-variant">
            Correo Electrónico
          </span>
          <input
            value={form.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
            required
            type="email"
            disabled={isSubmitting}
            className="border-0 border-b border-primary bg-transparent px-0 py-4 text-primary outline-none placeholder:text-outline focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="correo@ejemplo.com"
            autoComplete="email"
          />
        </label>

        <label className="grid gap-3">
          <span className="font-label-caps text-on-surface-variant">
            Dirección de Entrega
          </span>
          <input
            value={form.address}
            onChange={(event) => onFieldChange("address", event.target.value)}
            required
            disabled={isSubmitting}
            className="border-0 border-b border-primary bg-transparent px-0 py-4 text-primary outline-none placeholder:text-outline focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Calle, número, colonia"
            autoComplete="shipping street-address"
          />
        </label>

        <div className="grid gap-8 md:grid-cols-2">
          <label className="grid gap-3">
            <span className="font-label-caps text-on-surface-variant">Ciudad</span>
            <input
              value={form.city}
              onChange={(event) => onFieldChange("city", event.target.value)}
              required
              disabled={isSubmitting}
              className="border-0 border-b border-primary bg-transparent px-0 py-4 text-primary outline-none placeholder:text-outline focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ciudad"
              autoComplete="shipping address-level2"
            />
          </label>

          <label className="grid gap-3">
            <span className="font-label-caps text-on-surface-variant">
              Código Postal
            </span>
            <input
              value={form.postalCode}
              onChange={(event) => onFieldChange("postalCode", event.target.value)}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              disabled={isSubmitting}
              className="border-0 border-b border-primary bg-transparent px-0 py-4 text-primary outline-none placeholder:text-outline focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="00000"
              autoComplete="shipping postal-code"
            />
          </label>
        </div>
      </form>
    </section>
  );
}

function CheckoutSummary({
  items,
  subtotal,
  isSubmitting,
  onSubmit,
}: {
  items: CheckoutPageItem[];
  subtotal: number;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  const shipping = getShippingCost(subtotal);
  const total = subtotal + shipping;
  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.cantidad, 0),
    [items],
  );

  return (
    <aside className="border-y border-primary bg-background py-8 lg:sticky lg:top-[80px] lg:self-start">
      <p className="font-label-caps text-on-surface-variant">RESUMEN DE LA BOLSA</p>
      <p className="mt-1 font-label-caps text-on-surface-variant">
        {totalQuantity} PRENDA{totalQuantity === 1 ? "" : "S"}
      </p>

      <div className="mt-8 grid gap-6">
        {items.map((item) => (
          <article key={item.id} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4">
            <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-high">
              <CheckoutProductImage item={item} />
            </div>

            <div className="min-w-0">
              <p className="font-label-caps text-on-surface-variant">
                {item.producto.categoria?.toUpperCase() ?? "ADA"}
              </p>
              <h3 className="mt-2 line-clamp-2 font-headline-md text-primary">
                {item.producto.nombre.toUpperCase()}
              </h3>
              <p className="mt-2 font-label-caps text-[10px] text-on-surface-variant tracking-widest">
                TALLA {item.variante?.talla.toUpperCase() ?? "SIN TALLA"} · CANT.{" "}
                {item.cantidad}
              </p>
              <p className="mt-3 font-body-md text-primary">
                {formatMoney(item.producto.precio)}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 space-y-5 border-t border-primary pt-8 font-body-md text-on-surface-variant">
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
        <div className="border-t border-primary pt-6 text-lg font-headline-md text-primary">
          <div className="flex items-center justify-between">
            <span>GRAN TOTAL</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      <p className="mt-6 font-link-sm text-on-surface-variant">
        Envío gratis en órdenes iguales o mayores a {formatMoney(FREE_SHIPPING_THRESHOLD)}.
      </p>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || items.length === 0}
        className="mt-8 w-full bg-primary py-5 font-label-caps tracking-widest text-on-primary transition-all hover:bg-neon-lime hover:text-primary disabled:cursor-not-allowed disabled:bg-outline disabled:text-on-primary"
      >
        {isSubmitting ? "PROCESANDO..." : "CONFIRMAR PEDIDO Y PAGAR"}
      </button>
    </aside>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const refreshCartRef = useRef(refreshCart);
  const [items, setItems] = useState<CheckoutPageItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [form, setForm] = useState<CheckoutForm>({
    fullName: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshCartRef.current = refreshCart;
  }, [refreshCart]);

  const loadCart = useCallback(async () => {
    setIsLoading(true);
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
      const message = getErrorMessage(caughtError, "No fue posible cargar tu bolsa.");

      setError(message);
      setItems([]);
      setSubtotal(0);
      refreshCartRef.current([]);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadCart();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadCart]);

  function handleFieldChange(field: keyof CheckoutForm, value: string) {
    setForm((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const checkoutItems: CheckoutItem[] = items.map((item) => ({
        cart_item_id: item.id,
        product_id: item.producto.id,
        variant_id: item.variante?.id ?? null,
        quantity: item.cantidad,
        price_at_purchase: item.producto.precio,
      }));

      const payload: CheckoutRequest = {
        full_name: form.fullName.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postal_code: form.postalCode.trim(),
        items: checkoutItems,
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as CheckoutApiResponse;

      if (!response.ok || !result.ok) {
        throw new Error(
          result.ok ? result.mensaje : "No fue posible procesar tu pedido.",
        );
      }

      refreshCart([]);
      setItems([]);
      setSubtotal(0);
      router.push("/checkout/gracias");
    } catch (caughtError) {
      const message = getErrorMessage(caughtError, "No fue posible procesar tu pedido.");

      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
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
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-container-margin py-section-gap">
        <p className="font-label-caps text-outline">CHECKOUT ADA</p>
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
          <p className="font-label-caps text-on-surface-variant">CHECKOUT ADA</p>
          <h1 className="mt-2 font-headline-lg text-primary">ENVÍO Y PAGO</h1>
        </div>
        <p className="font-label-caps text-on-surface-variant">
          PRECIOS EN PESOS MEXICANOS
        </p>
      </div>

      {error ? (
        <div className="mt-8 border border-error p-5 font-body-md text-error">
          {error}
          <button
            type="button"
            onClick={() => {
              void loadCart();
            }}
            className="ml-4 border-b border-error font-label-caps"
          >
            REINTENTAR
          </button>
        </div>
      ) : null}

      <div className="mt-12 grid gap-12 lg:grid-cols-[3fr_2fr]">
        <ShippingForm
          form={form}
          isSubmitting={isSubmitting}
          onFieldChange={handleFieldChange}
        />
        <CheckoutSummary
          items={items}
          subtotal={subtotal}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}
