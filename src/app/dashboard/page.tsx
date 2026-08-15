import { AutoRefresh } from "@/components/auto-refresh";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardOverviewPage() {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ count: pendingOrders }, { count: activeTables }, { data: todayOrders }, { data: recentOrders }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.restaurantId)
        .in("status", ["pending", "accepted", "preparing"]),
      supabase
        .from("restaurant_tables")
        .select("id, branches!inner(restaurant_id)", { count: "exact", head: true })
        .eq("branches.restaurant_id", restaurant.restaurantId)
        .neq("status", "available"),
      supabase
        .from("orders")
        .select("total_amount, status")
        .eq("restaurant_id", restaurant.restaurantId)
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("orders")
        .select("id, order_number, status, total_amount, order_items(item_name, quantity)")
        .eq("restaurant_id", restaurant.restaurantId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const todayRevenue = (todayOrders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total_amount, 0);

  const stats = [
    { label: "Today's Orders", value: todayOrders?.length ?? 0 },
    { label: "Pending Orders", value: pendingOrders ?? 0 },
    { label: "Active Tables", value: activeTables ?? 0 },
    { label: "Today's Revenue", value: `₹${todayRevenue}` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh intervalMs={8000} />
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-muted-foreground">{restaurant.restaurantName} — live overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live order feed</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(recentOrders ?? []).map((order) => (
            <div key={order.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div>
                <p className="font-medium">Order #{order.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  {order.order_items.map((i) => `${i.item_name} × ${i.quantity}`).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">₹{order.total_amount}</span>
                <Badge>{order.status}</Badge>
              </div>
            </div>
          ))}
          {(!recentOrders || recentOrders.length === 0) && (
            <p className="text-sm text-muted-foreground">
              No orders yet. Once customers start scanning table QR codes, live orders will appear
              here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
