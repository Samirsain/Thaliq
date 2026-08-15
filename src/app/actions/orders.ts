"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type PlaceOrderLine = {
  itemId: string;
  variantId: string | null;
  addonIds: string[];
  quantity: number;
  specialInstructions: string;
};

export type PlaceOrderInput = {
  restaurantSlug: string;
  branchSlug: string;
  tableId?: string;
  lines: PlaceOrderLine[];
  couponCode?: string;
  customerName?: string;
  customerPhone?: string;
};

export type PlaceOrderResult = { orderId: string; orderNumber: number } | { error: string };

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Places a customer order. The client cart only drives the UI — every price
 * here is re-fetched from the database by ID and recomputed server-side, so
 * a tampered client request cannot change what the restaurant gets paid.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (!input.lines || input.lines.length === 0) {
    return { error: "Cart is empty." };
  }

  const admin = createAdminClient();

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id, tax_percent, service_charge_percent, status")
    .eq("slug", input.restaurantSlug)
    .maybeSingle();

  if (!restaurant || restaurant.status !== "active") {
    return { error: "Restaurant not found." };
  }

  const { data: branch } = await admin
    .from("branches")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("slug", input.branchSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!branch) {
    return { error: "Branch not found." };
  }

  let tableId: string | null = null;
  if (input.tableId) {
    const { data: table } = await admin
      .from("restaurant_tables")
      .select("id")
      .eq("id", input.tableId)
      .eq("branch_id", branch.id)
      .maybeSingle();
    if (!table) return { error: "Table not found." };
    tableId = table.id;
  }

  const itemIds = [...new Set(input.lines.map((l) => l.itemId))];
  const { data: items } = await admin
    .from("menu_items")
    .select(
      "id, name, base_price, is_available, restaurant_id, menu_variants(id, name, price), menu_addons(id, name, price)",
    )
    .in("id", itemIds)
    .eq("restaurant_id", restaurant.id);

  const itemsById = new Map((items ?? []).map((item) => [item.id, item]));

  type ResolvedLine = {
    itemId: string;
    itemName: string;
    variantId: string | null;
    variantName: string | null;
    unitPrice: number;
    quantity: number;
    addonSelection: { id: string; name: string; price: number }[];
    specialInstructions: string;
    lineTotal: number;
  };

  const resolvedLines: ResolvedLine[] = [];

  for (const line of input.lines) {
    const item = itemsById.get(line.itemId);
    if (!item) return { error: "One of the items in your cart is no longer available." };
    if (!item.is_available) return { error: `${item.name} is currently sold out.` };
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 50) {
      return { error: "Invalid quantity." };
    }

    let unitPrice = item.base_price;
    let variantName: string | null = null;
    if (line.variantId) {
      const variant = item.menu_variants.find((v) => v.id === line.variantId);
      if (!variant) return { error: "Invalid variant selected." };
      unitPrice = variant.price;
      variantName = variant.name;
    }

    const addonSelection: { id: string; name: string; price: number }[] = [];
    for (const addonId of line.addonIds) {
      const addon = item.menu_addons.find((a) => a.id === addonId);
      if (!addon) return { error: "Invalid add-on selected." };
      addonSelection.push({ id: addon.id, name: addon.name, price: addon.price });
    }

    const addonsTotal = addonSelection.reduce((sum, a) => sum + a.price, 0);

    resolvedLines.push({
      itemId: item.id,
      itemName: item.name,
      variantId: line.variantId,
      variantName,
      unitPrice,
      quantity: line.quantity,
      addonSelection,
      specialInstructions: line.specialInstructions.slice(0, 300),
      lineTotal: (unitPrice + addonsTotal) * line.quantity,
    });
  }

  const subtotal = resolvedLines.reduce((sum, l) => sum + l.lineTotal, 0);

  let discountAmount = 0;
  let couponId: string | null = null;

  if (input.couponCode) {
    const { data: coupon } = await admin
      .from("coupons")
      .select(
        "id, usage_limit, times_used, is_active, offers(type, percentage_value, flat_value, min_order_value, max_discount_value, is_active)",
      )
      .eq("restaurant_id", restaurant.id)
      .eq("code", input.couponCode.trim().toUpperCase())
      .maybeSingle();

    if (!coupon || !coupon.is_active) return { error: "Invalid coupon code." };
    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
      return { error: "This coupon has reached its usage limit." };
    }

    const offer = coupon.offers as unknown as {
      type: string;
      percentage_value: number | null;
      flat_value: number | null;
      min_order_value: number | null;
      max_discount_value: number | null;
      is_active: boolean;
    } | null;

    if (!offer || !offer.is_active) return { error: "This coupon's offer is no longer active." };
    if (offer.min_order_value && subtotal < offer.min_order_value) {
      return { error: `Minimum order value for this coupon is ₹${offer.min_order_value}.` };
    }

    if (offer.type === "percentage" && offer.percentage_value) {
      discountAmount = subtotal * (offer.percentage_value / 100);
    } else if (offer.type === "flat" && offer.flat_value) {
      discountAmount = offer.flat_value;
    }
    if (offer.max_discount_value) {
      discountAmount = Math.min(discountAmount, offer.max_discount_value);
    }
    discountAmount = Math.min(discountAmount, subtotal);
    couponId = coupon.id;
  }

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = round2(taxableAmount * (restaurant.tax_percent / 100));
  const serviceChargeAmount = round2(taxableAmount * (restaurant.service_charge_percent / 100));
  const totalAmount = round2(taxableAmount + taxAmount + serviceChargeAmount);

  let customerId: string | null = null;
  if (input.customerPhone) {
    const { data: customer } = await admin
      .from("customers")
      .upsert(
        { restaurant_id: restaurant.id, phone: input.customerPhone, name: input.customerName || null },
        { onConflict: "restaurant_id,phone" },
      )
      .select("id")
      .single();
    customerId = customer?.id ?? null;
  }

  let tableSessionId: string | null = null;
  if (tableId) {
    const { data: openSession } = await admin
      .from("table_sessions")
      .select("id")
      .eq("table_id", tableId)
      .eq("status", "open")
      .maybeSingle();

    tableSessionId = openSession?.id ?? null;

    if (!tableSessionId) {
      const { data: newSession } = await admin
        .from("table_sessions")
        .insert({ table_id: tableId })
        .select("id")
        .single();
      tableSessionId = newSession?.id ?? null;
    }
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      restaurant_id: restaurant.id,
      branch_id: branch.id,
      table_session_id: tableSessionId,
      customer_id: customerId,
      coupon_id: couponId,
      subtotal: round2(subtotal),
      discount_amount: round2(discountAmount),
      tax_amount: taxAmount,
      service_charge_amount: serviceChargeAmount,
      total_amount: totalAmount,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "Could not place order." };
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    resolvedLines.map((line) => ({
      order_id: order.id,
      item_id: line.itemId,
      variant_id: line.variantId,
      item_name: line.itemName,
      variant_name: line.variantName,
      unit_price: line.unitPrice,
      quantity: line.quantity,
      addon_selection: line.addonSelection,
      special_instructions: line.specialInstructions || null,
    })),
  );

  if (itemsError) {
    return { error: itemsError.message };
  }

  await admin.from("order_status_history").insert({ order_id: order.id, status: "pending" });

  if (tableId) {
    await admin.from("restaurant_tables").update({ status: "order_pending" }).eq("id", tableId);
  }

  if (couponId) {
    await admin.rpc("increment_coupon_usage", { p_coupon_id: couponId });
  }

  return { orderId: order.id, orderNumber: order.order_number };
}
