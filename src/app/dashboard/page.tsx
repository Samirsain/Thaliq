import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardOverviewPage() {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ count: ordersToday }, { count: pendingOrders }, { count: activeTables }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.restaurantId)
        .gte("created_at", todayStart.toISOString()),
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
    ]);

  const stats = [
    { label: "Today's Orders", value: ordersToday ?? 0 },
    { label: "Pending Orders", value: pendingOrders ?? 0 },
    { label: "Active Tables", value: activeTables ?? 0 },
    { label: "Today's Revenue", value: "₹0" },
  ];

  return (
    <div className="flex flex-col gap-6">
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
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No orders yet. Once customers start scanning table QR codes, live orders will appear
            here in real time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
