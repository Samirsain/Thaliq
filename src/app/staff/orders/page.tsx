import { AutoRefresh } from "@/components/auto-refresh";
import { TableSessionCard } from "@/components/staff/table-session-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperationalStaffSession } from "@/lib/staff-session";
import { staffLogout } from "@/app/actions/staff-auth";

const NEW_STATUSES = ["pending", "accepted", "preparing"];

function getPriority(status: string, orders: { status: string }[]): number {
  const hasNew = orders.some((o) => NEW_STATUSES.includes(o.status));
  const hasReady = orders.some((o) => o.status === "ready");
  const readyToPay = ["bill_requested", "payment_pending"].includes(status);
  if (readyToPay) return 0;
  if (hasNew) return 1;
  if (hasReady) return 2;
  return 3;
}

export default async function UnifiedOrdersPage() {
  const session = await requireOperationalStaffSession();
  const admin = createAdminClient();

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("name")
    .eq("id", session.restaurantId)
    .maybeSingle();

  let tableQuery = admin
    .from("restaurant_tables")
    .select("id, label, branches!inner(id, restaurant_id)")
    .eq("branches.restaurant_id", session.restaurantId);

  if (session.branchId) {
    tableQuery = tableQuery.eq("branch_id", session.branchId);
  }

  const { data: tables } = await tableQuery.order("label");

  const tableMap = new Map((tables ?? []).map((t) => [t.id, t.label]));
  const tableIds = (tables ?? []).map((t) => t.id);

  if (tableIds.length === 0) {
    return (
      <div className="flex min-h-screen flex-col gap-6 bg-muted/20 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Orders</h1>
            <p className="text-muted-foreground">{session.name}</p>
          </div>
          <form action={staffLogout}>
            <Button type="submit" variant="outline">Sign out</Button>
          </form>
        </div>
        <p className="text-sm text-muted-foreground">No tables configured.</p>
      </div>
    );
  }

  const { data: sessions } = await admin
    .from("table_sessions")
    .select(
      `id, status, opened_at, table_id,
       orders(id, order_number, status, total_amount, created_at, order_items(id, item_name, variant_name, quantity)),
       bills(id, status, total_amount)`,
    )
    .in("table_id", tableIds)
    .in("status", ["open", "bill_requested", "payment_pending"])
    .order("opened_at", { ascending: false });

  const sortedSessions = (sessions ?? []).sort((a, b) => {
    const aPriority = getPriority(a.status, a.orders ?? []);
    const bPriority = getPriority(b.status, b.orders ?? []);
    return aPriority - bPriority;
  });

  const activeTableIds = new Set((sessions ?? []).map((s) => s.table_id));
  const availableTables = (tables ?? []).filter((t) => !activeTableIds.has(t.id));

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-muted/20 p-4 sm:p-6">
      <AutoRefresh intervalMs={4000} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{restaurant?.name ?? "Staff Console"}</h1>
          <p className="text-muted-foreground">Welcome, {session.name}</p>
        </div>
        <form action={staffLogout}>
          <Button type="submit" variant="outline">Sign out</Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedSessions.map((s) => {
          const allOrders = (s.orders ?? []).filter((o) => o.status !== "cancelled");
          const runningTotal = allOrders.reduce((sum, o) => sum + o.total_amount, 0);
          return (
            <TableSessionCard
              key={s.id}
              session={{
                id: s.id,
                status: s.status,
                tableLabel: tableMap.get(s.table_id) ?? "—",
                openedAt: s.opened_at,
                rounds: allOrders.map((o) => ({
                  id: o.id,
                  order_number: o.order_number,
                  status: o.status,
                  created_at: o.created_at,
                  order_items: o.order_items,
                })),
                runningTotal,
                bill: (s.bills ?? []).find((b) => b.status !== "paid") ?? null,
              }}
            />
          );
        })}
        {sortedSessions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No active tables. New orders will appear here instantly.
          </p>
        )}
      </div>

      {availableTables.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Available tables ({availableTables.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {availableTables.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-md border bg-card p-3 text-sm">
                <span className="font-medium">Table {t.label}</span>
                <Badge variant="outline">Available</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
