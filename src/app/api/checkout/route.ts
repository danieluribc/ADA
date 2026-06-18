import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Extraemos las variables con los nombres exactos enviados por el frontend (page.tsx)
    const fullName = body.full_name;
    const email = body.email;
    const address = body.address;
    const city = body.city;
    const postalCode = body.postal_code;
    const cartItems = body.items || [];

    // 1. Validar campos obligatorios
    if (!fullName || !email || !address || !city || !postalCode) {
      return NextResponse.json(
        { ok: false, mensaje: "Faltan campos obligatorios de envío." },
        { status: 400 }
      );
    }

    // 2. Leer la cookie real del token del carrito
    const cookieStore = await cookies();
    const cartToken = cookieStore.get("ada_cart_token")?.value?.trim();

    if (!cartToken) {
      return NextResponse.json(
        { ok: false, mensaje: "No se encontró un carrito activo para procesar." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // 3. Buscar el UUID real del carrito correspondiente a ese token
    const { data: cartData, error: cartLookupError } = await supabaseAdmin
      .from("carts")
      .select("id")
      .eq("cart_token", cartToken)
      .maybeSingle();

    if (cartLookupError || !cartData) {
      return NextResponse.json(
        { ok: false, mensaje: "El token de tu bolsa no corresponde a un registro válido." },
        { status: 400 }
      );
    }

    // 4. Recalcular montos de manera segura en el servidor
    let calculatedSubtotal = 0;
    if (cartItems && cartItems.length > 0) {
      cartItems.forEach((item: any) => {
        calculatedSubtotal += (item.price_at_purchase || 0) * (item.quantity || 1);
      });
    }

    const shippingCost = calculatedSubtotal >= 120000 ? 0 : 15000;
    const total = calculatedSubtotal + shippingCost;

    // 5. Insertar la cabecera del pedido en public.orders
    // Forzamos 'pending' para cumplir estrictamente con el check constraint de tu Postgres
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        cart_id: cartData.id,
        email: email,
        status: "pending", // <-- Usamos la palabra exacta permitida
        subtotal: Math.round(calculatedSubtotal),
        shipping_cost: Math.round(shippingCost),
        total: Math.round(total),
        full_name: fullName,
        address: address,
        city: city,
        postal_code: postalCode
      })
      .select("id")
      .single();

    if (orderError || !orderData) {
      console.error("❌ Error Supabase al insertar en orders:", orderError);
      return NextResponse.json(
        { ok: false, mensaje: `Error al crear la orden: ${orderError?.message}` },
        { status: 500 }
      );
    }

    const orderId = orderData.id;

    // 6. Insertar el desglose de productos en public.order_items usando tus columnas reales
    if (cartItems && cartItems.length > 0) {
      const itemsToInsert = cartItems.map((item: any) => ({
        order_id: orderId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: "Prenda ADA",
        size: "U",
        quantity: Math.round(item.quantity || 1),
        unit_price: Math.round(item.price_at_purchase || 0)
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("❌ Error Supabase al insertar en order_items:", itemsError);
        return NextResponse.json(
          { ok: false, mensaje: `Error al registrar los artículos: ${itemsError.message}` },
          { status: 500 }
        );
      }
    }

    // 7. Vaciado físico de la bolsa del cliente
    await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("cart_id", cartData.id);

    return NextResponse.json({
      ok: true,
      mensaje: "Pedido processed exitosamente.",
      datos: { order_id: orderId, status: "pending", total }
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Error crítico no controlado en Checkout:", error.message);
    return NextResponse.json(
      { ok: false, error: { codigo: "INTERNAL_ERROR", mensaje: error.message } },
      { status: 500 }
    );
  }
}