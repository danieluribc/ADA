import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const CART_COOKIE_NAME = "ada_cart_token";
const MOCK_CART_COOKIE_NAME = "ada_mock_cart_items";
const CART_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type CartRow = {
  id: string;
  cart_token: string;
  created_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  category: string | null;
};

type VariantRow = {
  id: string;
  product_id: string;
  size: string;
  stock: number;
};

type ProductImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  image_alt?: string | null;
  sort_order?: number | null;
};

type ProductRowWithImages = ProductRow & {
  product_images?: ProductImageRow | ProductImageRow[] | null;
};

type CartItemRow = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  products: ProductRowWithImages | ProductRowWithImages[];
  product_variants: VariantRow | VariantRow[] | null;
};

type CartResponseItem = {
  id: string;
  producto: {
    id: string;
    nombre: string;
    precio: number;
    categoria: string | null;
  };
  variante: {
    id: string;
    talla: string;
    stock: number;
  } | null;
  imagen: {
    url: string | null;
    texto_alt: string | null;
  } | null;
  cantidad: number;
  subtotal: number;
};

type CartResponse = {
  id: string | null;
  cart_token: string | null;
  moneda: "MXN";
  cantidad_total: number;
  subtotal: number;
  total: number;
  items: CartResponseItem[];
};

type MockCartItem = {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  product: ProductRow;
  variant: VariantRow;
};

type ApiErrorBody = {
  codigo: string;
  mensaje: string;
  detalles?: unknown;
};

type ApiResponse<T> =
  | { ok: true; mensaje: string; datos: T }
  | { ok: false; error: ApiErrorBody };

function createEmptyCartResponse(): CartResponse {
  return {
    id: null,
    cart_token: null,
    moneda: "MXN",
    cantidad_total: 0,
    subtotal: 0,
    total: 0,
    items: [],
  };
}

function jsonOk<T>(mensaje: string, datos: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>(
    {
      ok: true,
      mensaje,
      datos,
    },
    { status },
  );
}

function jsonError(
  status: number,
  codigo: string,
  mensaje: string,
  detalles?: unknown,
) {
  return NextResponse.json<ApiResponse<never>>(
    {
      ok: false,
      error: {
        codigo,
        mensaje,
        detalles,
      },
    },
    { status },
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Error desconocido.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readPositiveInteger(value: unknown): number | null {
  const numericValue = typeof value === "string" ? Number(value) : value;

  return typeof numericValue === "number" &&
    Number.isInteger(numericValue) &&
    numericValue > 0
    ? numericValue
    : null;
}

function readNonNegativeInteger(value: unknown): number | null {
  const numericValue = typeof value === "string" ? Number(value) : value;

  return typeof numericValue === "number" &&
    Number.isInteger(numericValue) &&
    numericValue >= 0
    ? numericValue
    : null;
}

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function isMockProductId(productId: string): boolean {
  return productId.toLowerCase().startsWith("mock");
}

function getMockProduct(productId: string): ProductRow {
  return {
    id: productId,
    name: "Prenda de Prueba ADA",
    price: 120000,
    category: "PRUEBA",
  };
}

function getMockVariant(variantId: string, productId: string): VariantRow {
  const rawSize = variantId.split("-").pop()?.toUpperCase() ?? "M";
  const size = ["XS", "S", "M", "L", "XL"].includes(rawSize) ? rawSize : "M";

  return {
    id: variantId,
    product_id: productId,
    size,
    stock: Number.MAX_SAFE_INTEGER,
  };
}

function createMockItemId(productId: string, variantId: string): string {
  return `${productId}__${variantId}`;
}

function isMockCartItem(value: unknown): value is MockCartItem {
  if (!isRecord(value)) {
    return false;
  }

  const product = value.product;
  const variant = value.variant;

  return (
    typeof value.id === "string" &&
    typeof value.product_id === "string" &&
    typeof value.variant_id === "string" &&
    typeof value.quantity === "number" &&
    isRecord(product) &&
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.price === "number" &&
    (typeof product.category === "string" || product.category === null) &&
    isRecord(variant) &&
    typeof variant.id === "string" &&
    typeof variant.product_id === "string" &&
    typeof variant.size === "string" &&
    typeof variant.stock === "number"
  );
}

async function readCartToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CART_COOKIE_NAME);

  return cookie?.value.trim() ? cookie.value.trim() : null;
}

async function setCartTokenCookie(cartToken: string) {
  const cookieStore = await cookies();

  cookieStore.set(CART_COOKIE_NAME, cartToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: CART_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

async function readMockCartItems(): Promise<MockCartItem[]> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(MOCK_CART_COOKIE_NAME);

  if (!cookie?.value) {
    return [];
  }

  try {
    const parsed = JSON.parse(cookie.value);
    return Array.isArray(parsed) ? parsed.filter(isMockCartItem) : [];
  } catch {
    return [];
  }
}

async function writeMockCartItems(items: MockCartItem[]) {
  const cookieStore = await cookies();

  cookieStore.set(MOCK_CART_COOKIE_NAME, JSON.stringify(items), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: CART_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

function upsertMockCartItem(
  items: MockCartItem[],
  productId: string,
  variantId: string,
  quantity: number,
): MockCartItem[] {
  const mockProduct = getMockProduct(productId);
  const mockVariant = getMockVariant(variantId, productId);
  const itemId = createMockItemId(productId, variantId);
  const existingItemIndex = items.findIndex((item) => item.id === itemId);

  if (existingItemIndex === -1) {
    return [
      ...items,
      {
        id: itemId,
        product_id: productId,
        variant_id: variantId,
        quantity,
        product: mockProduct,
        variant: mockVariant,
      },
    ];
  }

  return items.map((item, index) => {
    if (index !== existingItemIndex) {
      return item;
    }

    return {
      ...item,
      quantity: item.quantity + quantity,
      product: mockProduct,
      variant: mockVariant,
    };
  });
}

function updateMockCartItemQuantity(
  items: MockCartItem[],
  itemId: string,
  quantity: number,
): MockCartItem[] {
  return items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    return {
      ...item,
      quantity,
    };
  });
}

function removeMockCartItem(items: MockCartItem[], itemId: string): MockCartItem[] {
  return items.filter((item) => item.id !== itemId);
}

function getMockCartResponseItem(item: MockCartItem): CartResponseItem {
  const subtotal = item.product.price * item.quantity;

  return {
    id: item.id,
    producto: {
      id: item.product.id,
      nombre: item.product.name,
      precio: item.product.price,
      categoria: item.product.category,
    },
    variante: {
      id: item.variant.id,
      talla: item.variant.size,
      stock: item.variant.stock,
    },
    imagen: null,
    cantidad: item.quantity,
    subtotal,
  };
}

function mergeCartResponses(
  basePayload: CartResponse,
  mockItems: MockCartItem[],
): CartResponse {
  const items = [
    ...basePayload.items,
    ...mockItems.map(getMockCartResponseItem),
  ];
  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);

  return {
    ...basePayload,
    cantidad_total: items.reduce((total, item) => total + item.cantidad, 0),
    subtotal,
    total: subtotal,
    items,
  };
}

async function getCartByToken(cartToken: string): Promise<CartRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("carts")
    .select("id, cart_token, created_at")
    .eq("cart_token", cartToken)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function createCart(cartToken: string): Promise<CartRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("carts")
    .insert({ cart_token: cartToken })
    .select("id, cart_token, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No fue posible crear el carrito.");
  }

  return data;
}

async function getOrCreateCart(existingCartToken?: string): Promise<{
  cart: CartRow;
  token: string;
  isNew: boolean;
}> {
  if (existingCartToken) {
    const existingCart = await getCartByToken(existingCartToken);

    if (existingCart) {
      return {
        cart: existingCart,
        token: existingCartToken,
        isNew: false,
      };
    }
  }

  const token = existingCartToken ?? crypto.randomUUID();

  try {
    const cart = await createCart(token);

    return {
      cart,
      token,
      isNew: true,
    };
  } catch (error) {
    if (existingCartToken) {
      const existingCart = await getCartByToken(existingCartToken);

      if (existingCart) {
        return {
          cart: existingCart,
          token: existingCartToken,
          isNew: false,
        };
      }
    }

    throw error;
  }
}

async function requireCart(): Promise<CartRow | null> {
  const cartToken = await readCartToken();

  if (!cartToken) {
    return null;
  }

  return getCartByToken(cartToken);
}

async function getProduct(productId: string): Promise<ProductRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, category")
    .eq("id", productId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getVariant(
  variantId: string,
  productId: string,
): Promise<VariantRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, product_id, size, stock")
    .eq("id", variantId)
    .eq("product_id", productId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    stock: readNonNegativeInteger(data.stock) ?? 0,
  };
}

async function getCartItemInCart(
  cartId: string,
  cartItemId: string,
): Promise<{ id: string; product_id: string; variant_id: string | null } | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("id, product_id, variant_id")
    .eq("id", cartItemId)
    .eq("cart_id", cartId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getCartPayload(cart: CartRow): Promise<CartResponse> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      cart_id,
      product_id,
      variant_id,
      quantity,
      products!inner (
        id,
        name,
        price,
        category,
        product_images!left (
          id,
          product_id,
          storage_path,
          image_alt,
          sort_order
        )
      ),
      product_variants!left (
        id,
        product_id,
        size,
        stock
      )
    `)
    .eq("cart_id", cart.id)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map((item: CartItemRow) => {
    const product = firstOrNull(item.products);
    const productImages = product
      ? firstOrNull(product.product_images)
      : null;
    const variant = firstOrNull(item.product_variants);
    const productPrice = product
      ? readNonNegativeInteger(product.price) ?? 0
      : 0;
    const quantity = readPositiveInteger(item.quantity) ?? 0;
    const subtotal = productPrice * quantity;

    return {
      id: item.id,
      producto: {
        id: product?.id ?? item.product_id,
        nombre: product?.name ?? "Producto ADA",
        precio: productPrice,
        categoria: product?.category ?? null,
      },
      variante: variant
        ? {
            id: variant.id,
            talla: variant.size,
            stock: readNonNegativeInteger(variant.stock) ?? 0,
          }
        : null,
      imagen: productImages
        ? {
            url:
              typeof productImages.storage_path === "string"
                ? productImages.storage_path
                : null,
            texto_alt: productImages.image_alt ?? null,
          }
        : null,
      cantidad: quantity,
      subtotal,
    };
  });

  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);

  return {
    id: cart.id,
    cart_token: cart.cart_token,
    moneda: "MXN",
    cantidad_total: items.reduce((total, item) => total + item.cantidad, 0),
    subtotal,
    total: subtotal,
    items,
  };
}

async function getHybridCartPayload(cart: CartRow): Promise<CartResponse> {
  let basePayload = createEmptyCartResponse();

  try {
    basePayload = await getCartPayload(cart);
  } catch (error) {
    console.warn("No fue posible leer items reales del carrito.", error);
  }

  return mergeCartResponses(basePayload, await readMockCartItems());
}

export async function GET(request: Request) {
  void request;

  try {
    const cartToken = await readCartToken();

    if (!cartToken) {
      return jsonOk("Carrito vacío.", createEmptyCartResponse());
    }

    const cart = await getCartByToken(cartToken);

    if (!cart) {
      return jsonOk("Carrito vacío.", createEmptyCartResponse());
    }

    return jsonOk("Carrito recuperado.", await getHybridCartPayload(cart));
  } catch (error) {
    console.error("Error interno en GET /api/cart.", error);

    return jsonError(
      500,
      "ERROR_INTERNO",
      getErrorMessage(error),
    );
  }
}

export async function POST(request: Request) {
  console.log("¡API CART POST DETECTADA!", request.body);

  try {
    const body = await readJsonBody(request);
    const productId = readString(body.product_id);
    const variantId = readString(body.variant_id);
    const quantity = readPositiveInteger(body.quantity);

    if (!productId || !variantId || !quantity) {
      return jsonError(
        400,
        "DATOS_INVALIDOS",
        "product_id, variant_id y quantity son requeridos.",
      );
    }

    const existingCartToken = await readCartToken();
    const { cart, token } = await getOrCreateCart(existingCartToken ?? undefined);

    if (!existingCartToken) {
      await setCartTokenCookie(token);
    }

    const isMockProduct = isMockProductId(productId);
    const product = isMockProduct
      ? getMockProduct(productId)
      : await getProduct(productId);

    if (!isMockProduct && !product) {
      throw new Error(`Producto no encontrado: ${productId}`);
    }

    const variant = isMockProduct
      ? getMockVariant(variantId, productId)
      : await getVariant(variantId, productId);

    if (!variant) {
      throw new Error(`Talla no encontrada: ${variantId}`);
    }

    if (quantity > variant.stock) {
      return jsonError(
        400,
        "STOCK_INSUFICIENTE",
        "Stock insuficiente para esta talla.",
      );
    }

    if (isMockProduct) {
      const currentMockItems = await readMockCartItems();
      const nextMockItems = upsertMockCartItem(
        currentMockItems,
        productId,
        variantId,
        quantity,
      );
      const addedItem = nextMockItems.find(
        (item) => item.id === createMockItemId(productId, variantId),
      );

      await writeMockCartItems(nextMockItems);

      return jsonOk("Producto de prueba agregado al carrito.", {
        cart: await getHybridCartPayload(cart),
        item: addedItem
          ? {
              id: addedItem.id,
              cart_id: cart.id,
              product_id: addedItem.product_id,
              variant_id: addedItem.variant_id,
              quantity: addedItem.quantity,
            }
          : null,
        accion: "agregar",
        modo: "mock",
      });
    }

    const supabase = createSupabaseAdminClient();
    const { data: existingItems, error: existingItemsError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cart.id)
      .eq("product_id", productId)
      .eq("variant_id", variantId);

    if (existingItemsError) {
      throw new Error(existingItemsError.message);
    }

    const existingItem = existingItems?.[0] ?? null;

    if (existingItem) {
      const nextQuantity =
        (readPositiveInteger(existingItem.quantity) ?? 0) + quantity;

      if (nextQuantity > variant.stock) {
        return jsonError(
          400,
          "STOCK_INSUFICIENTE",
          "Stock insuficiente para esta talla.",
        );
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: nextQuantity })
        .eq("id", existingItem.id)
        .eq("cart_id", cart.id)
        .select("id, cart_id, product_id, variant_id, quantity")
        .single();

      if (updateError || !updatedItem) {
        throw new Error(updateError?.message ?? "No fue posible actualizar el carrito.");
      }

      return jsonOk("Producto actualizado en el carrito.", {
        cart: await getHybridCartPayload(cart),
        item: updatedItem,
        accion: "actualizar",
        modo: "database",
      });
    }

    const { data: insertedItem, error: insertError } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId,
        quantity,
      })
      .select("id, cart_id, product_id, variant_id, quantity")
      .single();

    if (insertError || !insertedItem) {
      throw new Error(insertError?.message ?? "No fue posible agregar el producto al carrito.");
    }

    return jsonOk("Producto agregado al carrito.", {
      cart: await getHybridCartPayload(cart),
      item: insertedItem,
      accion: "agregar",
      modo: "database",
    });
  } catch (error) {
    console.error("Error interno en POST /api/cart.", error);

    return jsonError(500, "ERROR_INTERNO", getErrorMessage(error));
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await readJsonBody(request);
    const cartItemId = readString(body.cart_item_id);
    const quantity = readPositiveInteger(body.quantity);

    if (!cartItemId || !quantity) {
      return jsonError(
        400,
        "DATOS_INVALIDOS",
        "cart_item_id y quantity son requeridos.",
      );
    }

    const cart = await requireCart();

    if (!cart) {
      return jsonError(400, "CARRITO_NO_ENCONTRADO", "Carrito no encontrado.");
    }

    const mockItems = await readMockCartItems();
    const mockItemIndex = mockItems.findIndex((item) => item.id === cartItemId);

    if (mockItemIndex !== -1) {
      const mockItem = mockItems[mockItemIndex];

      if (quantity > mockItem.variant.stock) {
        return jsonError(
          400,
          "STOCK_INSUFICIENTE",
          "Stock insuficiente para esta talla.",
        );
      }

      const nextMockItems = updateMockCartItemQuantity(
        mockItems,
        cartItemId,
        quantity,
      );

      await writeMockCartItems(nextMockItems);

      return jsonOk("Cantidad actualizada.", {
        cart: await getHybridCartPayload(cart),
        item: {
          id: mockItem.id,
          cart_id: cart.id,
          product_id: mockItem.product_id,
          variant_id: mockItem.variant_id,
          quantity,
        },
        accion: "actualizar",
        modo: "mock",
      });
    }

    const cartItem = await getCartItemInCart(cart.id, cartItemId);

    if (!cartItem) {
      return jsonError(400, "ITEM_NO_ENCONTRADO", "Item no encontrado.");
    }

    if (!cartItem.variant_id) {
      return jsonError(400, "TALLA_INVALIDA", "Talla no válida.");
    }

    const variant = await getVariant(cartItem.variant_id, cartItem.product_id);

    if (!variant) {
      throw new Error(`Talla no encontrada: ${cartItem.variant_id}`);
    }

    if (quantity > variant.stock) {
      return jsonError(
        400,
        "STOCK_INSUFICIENTE",
        "Stock insuficiente para esta talla.",
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data: updatedItem, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", cartItemId)
      .eq("cart_id", cart.id)
      .select("id, cart_id, product_id, variant_id, quantity")
      .single();

    if (error || !updatedItem) {
      throw new Error(error?.message ?? "No fue posible actualizar la cantidad del item.");
    }

    return jsonOk("Cantidad actualizada.", {
      cart: await getHybridCartPayload(cart),
      item: updatedItem,
      accion: "actualizar",
      modo: "database",
    });
  } catch (error) {
    console.error("Error interno en PATCH /api/cart.", error);

    return jsonError(500, "ERROR_INTERNO", getErrorMessage(error));
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await readJsonBody(request);
    const searchParams = new URL(request.url).searchParams;
    const cartItemId =
      readString(body.cart_item_id) ??
      readString(searchParams.get("cart_item_id"));

    if (!cartItemId) {
      return jsonError(400, "DATOS_INVALIDOS", "cart_item_id es requerido.");
    }

    const cart = await requireCart();

    if (!cart) {
      return jsonError(400, "CARRITO_NO_ENCONTRADO", "Carrito no encontrado.");
    }

    const mockItems = await readMockCartItems();
    const nextMockItems = removeMockCartItem(mockItems, cartItemId);

    if (nextMockItems.length !== mockItems.length) {
      await writeMockCartItems(nextMockItems);

      return jsonOk("Item eliminado del carrito.", {
        cart: await getHybridCartPayload(cart),
        item_id: cartItemId,
        accion: "eliminar",
        modo: "mock",
      });
    }

    const cartItem = await getCartItemInCart(cart.id, cartItemId);

    if (!cartItem) {
      return jsonError(400, "ITEM_NO_ENCONTRADO", "Item no encontrado.");
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("cart_id", cart.id);

    if (error) {
      throw new Error(error.message);
    }

    return jsonOk("Item eliminado del carrito.", {
      cart: await getHybridCartPayload(cart),
      item_id: cartItemId,
      accion: "eliminar",
      modo: "database",
    });
  } catch (error) {
    console.error("Error interno en DELETE /api/cart.", error);

    return jsonError(500, "ERROR_INTERNO", getErrorMessage(error));
  }
}
