import { AutoRefresh } from "@/components/auto-refresh";
import { ReadyOrderCard } from "@/components/staff/ready-order-card";
import { WaiterRequestCard } from "@/components/staff/waiter-request-card";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffSession } from "@/lib/staff-session";
import { staffLogout } from "@/app/actions/staff-auth";

export default async function WaiterPage() {
  const session = await requireStaffSession("waiter");
  const admin = createAdminClient();

  let requestQuery = admin
    .from("waiter_requests")
    .select("id, type, restaurant_tables(label)")
    .is("resolved_at", null)
    .order("created_at");

  let readyQuery = admin
    .from("orders")
    .select(
      "id, order_number, order_items(id, item_name, variant_name, quantity), table_sessions(restaurant_tables(label))",
    )
    .eq("restaurant_id", session.restaurantId)
    .eq("status", "ready")
    .order("created_at");

  if (session.branchId) {
    requestQuery = requestQuery.eq("branch_id", session.branchId);
    readyQuery = readyQuery.eq("branch_id", session.branchId);
  }

  const [{ data: requests }, { data: readyOrders }] = await Promise.all([
    requestQuery,
    readyQuery,
  ]);

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-muted/20 p-4 sm:p-6">
      <AutoRefresh intervalMs={4000} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Waiter</h1>
          <p className="text-muted-foreground">{session.name}</p>
        </div>
        <form action={staffLogout}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">
          Ready to serve
          {readyOrders && readyOrders.length > 0 ? ` (${readyOrders.length})` : ""}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(readyOrders ?? []).map((order) => (
            <ReadyOrderCard
              key={order.id}
              order={{
                id: order.id,
                order_number: order.order_number,
                order_items: order.order_items,
                tableLabel:
                  (order.table_sessions as unknown as { restaurant_tables: { label: string } } | null)
                    ?.restaurant_tables.label ?? null,
              }}
            />
          ))}
          {(!readyOrders || readyOrders.length === 0) && (
            <p className="text-sm text-muted-foreground">
              Nothing ready right now. Orders appear here the moment the kitchen marks them ready.
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">
          Table requests
          {requests && requests.length > 0 ? ` (${requests.length})` : ""}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(requests ?? []).map((request) => (
            <WaiterRequestCard
              key={request.id}
              request={{
                id: request.id,
                type: request.type,
                tableLabel: (request.restaurant_tables as unknown as { label: string } | null)?.label ?? "—",
              }}
            />
          ))}
          {(!requests || requests.length === 0) && (
            <p className="text-sm text-muted-foreground">No open requests.</p>
          )}
        </div>
      </section>
    </div>
  );
}
