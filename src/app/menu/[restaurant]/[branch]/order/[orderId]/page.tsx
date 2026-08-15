import { notFound } from "next/navigation";

import { AutoRefresh } from "@/components/auto-refresh";
import { OrderStatusStepper } from "@/components/menu/order-status-stepper";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function OrderTrackingPage(
  props: PageProps<"/menu/[restaurant]/[branch]/order/[orderId]">,
) {
  const { restaurant: restaurantSlug, branch: branchSlug, orderId } = await props.params;
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(
      `id, order_number, status, subtotal, discount_amount, tax_amount, service_charge_amount, total_amount, created_at,
       restaurants!inner(name, slug), branches!inner(name, slug),
       order_items(id, item_name, variant_name, unit_price, quantity, addon_selection)`,
    )
    .eq("id", orderId)
    .maybeSingle();

  const restaurant = order?.restaurants as unknown as { name: string; slug: string } | undefined;
  const branch = order?.branches as unknown as { name: string; slug: string } | undefined;

  if (!order || restaurant?.slug !== restaurantSlug || branch?.slug !== branchSlug) {
    notFound();
  }

  const isFinal = ["served", "completed", "cancelled"].includes(order.status);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-4 pb-16">
      {!isFinal && <AutoRefresh intervalMs={4000} />}

      <div className="pt-6 text-center">
        <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
        <h1 className="text-2xl font-semibold">Order #{order.order_number}</h1>
        <Badge className="mt-2 capitalize">{order.status}</Badge>
      </div>

      <div className="rounded-lg border p-4">
        <OrderStatusStepper status={order.status} />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <h2 className="font-medium">Items</h2>
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.item_name}
              {item.variant_name ? ` (${item.variant_name})` : ""} × {item.quantity}
            </span>
            <span>₹{item.unit_price * item.quantity}</span>
          </div>
        ))}

        <div className="mt-2 flex flex-col gap-1 border-t pt-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-brand">
              <span>Discount</span>
              <span>−₹{order.discount_amount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax</span>
            <span>₹{order.tax_amount}</span>
          </div>
          <div className="flex justify-between">
            <span>Service charge</span>
            <span>₹{order.service_charge_amount}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>₹{order.total_amount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
