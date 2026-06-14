"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: number;
  };
  variant?: {
    id: string;
    size: string;
    stock: number;
  } | null;
};

type AddToCartInput = {
  productId: string;
  variantId?: string | null;
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (input: AddToCartInput) => void;
  removeFromCart: (cartItemId: string) => void;
  refreshCart: (items: CartItem[]) => void;
};

const CART_STORAGE_KEY = "ada_cart_items";

const hydrationListeners = new Set<() => void>();
let hasHydrated = false;

const CartContext = createContext<CartContextValue | null>(null);

function subscribeToHydration(listener: () => void) {
  hydrationListeners.add(listener);

  return () => {
    hydrationListeners.delete(listener);
  };
}

function getHydrationSnapshot() {
  return hasHydrated;
}

function getServerHydrationSnapshot() {
  return false;
}

function markHydrated() {
  if (hasHydrated) {
    return;
  }

  hasHydrated = true;
  hydrationListeners.forEach((listener) => listener());
}

function calculateCartCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + Math.max(0, item.quantity), 0);
}

function createClientItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.cartId === "string" &&
    typeof value.productId === "string" &&
    (typeof value.variantId === "string" || value.variantId === null) &&
    typeof value.quantity === "number" &&
    Number.isFinite(value.quantity) &&
    value.quantity > 0
  );
}

function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isCartItem).map((item) => ({
    ...item,
    quantity: Math.floor(item.quantity),
  }));
}

function persistCartItems(items: CartItem[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("No fue posible guardar el carrito en almacenamiento local.", error);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const loading = !hydrated;

  useEffect(() => {
    markHydrated();
  }, []);

  const commitItems = useCallback(
    (nextItems: CartItem[] | ((currentItems: CartItem[]) => CartItem[])) => {
      const resolvedItems =
        typeof nextItems === "function" ? nextItems(items) : nextItems;

      setItems(resolvedItems);
      setCartCount(calculateCartCount(resolvedItems));
      persistCartItems(resolvedItems);
    },
    [items],
  );

  const addToCart = useCallback(
    ({ productId, variantId = null, quantity = 1 }: AddToCartInput) => {
      const nextQuantity = Math.max(1, Math.floor(quantity));

      commitItems((currentItems) => {
        const existingItemIndex = currentItems.findIndex(
          (item) => item.productId === productId && item.variantId === variantId,
        );

        if (existingItemIndex === -1) {
          return [
            ...currentItems,
            {
              id: createClientItemId(),
              cartId: "pending",
              productId,
              variantId,
              quantity: nextQuantity,
            },
          ];
        }

        return currentItems.map((item, index) => {
          if (index !== existingItemIndex) {
            return item;
          }

          return {
            ...item,
            quantity: item.quantity + nextQuantity,
          };
        });
      });
    },
    [commitItems],
  );

  const removeFromCart = useCallback(
    (cartItemId: string) => {
      commitItems((currentItems) =>
        currentItems.filter((item) => item.id !== cartItemId),
      );
    },
    [commitItems],
  );

  const refreshCart = useCallback(
    (nextItems: CartItem[]) => {
      commitItems(normalizeCartItems(nextItems));
    },
    [commitItems],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      cartCount,
      loading,
      addToCart,
      removeFromCart,
      refreshCart,
    }),
    [addToCart, cartCount, items, loading, refreshCart, removeFromCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider.");
  }

  return context;
}
