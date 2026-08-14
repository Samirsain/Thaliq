import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ count: restaurants }, { count: activeSubs }, { count: trials }, { count: orders }] =
    await Promise.all([
      supabase.from("restaurants").select("id", { count: "exact", head: true }),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "trialing"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
    ]);

  const stats = [
    { label: "Restaurants", value: restaurants ?? 0 },
    { label: "Active Subscriptions", value: activeSubs ?? 0 },
    { label: "Trials", value: trials ?? 0 },
    { label: "Total Orders", value: orders ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform overview</h1>
        <p className="text-muted-foreground">THALIQ across every restaurant on the platform.</p>
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
    </div>
  );
}
