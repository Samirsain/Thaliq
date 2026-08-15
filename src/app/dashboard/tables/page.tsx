import { AutoRefresh } from "@/components/auto-refresh";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTableForm } from "@/components/dashboard/add-table-form";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

const STATUS_VARIANT: Record<string, "default" | "brand" | "secondary" | "destructive" | "outline"> = {
  available: "secondary",
  occupied: "default",
  order_pending: "brand",
  preparing: "default",
  ready: "default",
  bill_requested: "destructive",
  cleaning: "outline",
};

export default async function TablesPage() {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name")
    .eq("restaurant_id", restaurant.restaurantId)
    .order("name");

  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, label, status, branches!inner(id, name, restaurant_id)")
    .eq("branches.restaurant_id", restaurant.restaurantId)
    .order("label");

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh intervalMs={8000} />
      <div>
        <h1 className="text-2xl font-semibold">Tables</h1>
        <p className="text-muted-foreground">Manage tables across your branches.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a table</CardTitle>
        </CardHeader>
        <CardContent>
          {branches && branches.length > 0 ? (
            <AddTableForm branches={branches} />
          ) : (
            <p className="text-sm text-muted-foreground">Create a branch first.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(tables ?? []).map((table) => (
          <Card key={table.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-medium">{table.label}</p>
                <p className="text-xs text-muted-foreground">
                  {(table.branches as unknown as { name: string }).name}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[table.status] ?? "secondary"}>
                {table.status.replace("_", " ")}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {(!tables || tables.length === 0) && (
          <p className="text-sm text-muted-foreground">No tables yet.</p>
        )}
      </div>
    </div>
  );
}
