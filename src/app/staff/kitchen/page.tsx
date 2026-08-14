import { KitchenOrderCard } from "@/components/staff/kitchen-order-card";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffSession } from "@/lib/staff-session";
import { staffLogout } from "@/app/actions/staff-auth";

export default async function KitchenPage() {
  const session = await requireStaffSession("kitchen");
  const admin = createAdminClient();

  let query = admin
    .from("orders")
    .select(
      "id, order_number, status, order_items(id, item_name, quantity), table_sessions(restaurant_tables(label))",
    )
    .eq("restaurant_id", session.restaurantId)
    .in("status", ["pending", "accepted", "preparing"])
    .order("created_at");

  if (session.branchId) {
    query = query.eq("branch_id", session.branchId);
  }

  const { data: orders } = await query;

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-muted/20 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kitchen</h1>
          <p className="text-muted-foreground">{session.name}</p>
        </div>
        <form action={staffLogout}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(orders ?? []).map((order) => (
          <KitchenOrderCard
            key={order.id}
            order={{
              id: order.id,
              order_number: order.order_number,
              status: order.status,
              order_items: order.order_items,
              tableLabel:
                (order.table_sessions as unknown as { restaurant_tables: { label: string } } | null)
                  ?.restaurant_tables.label ?? null,
            }}
          />
        ))}
        {(!orders || orders.length === 0) && (
          <p className="text-sm text-muted-foreground">No active orders. New orders will appear here instantly.</p>
        )}
      </div>
    </div>
  );
}
