import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { markTableCleaned } from "@/app/actions/tables";

export default async function TablesPage() {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, restaurant_tables(id, label, seats, status)")
    .eq("restaurant_id", restaurant.restaurantId)
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Tables</h1>
        <p className="text-muted-foreground">
          Manage your floor plan. Tables cycle through available, order_pending, occupied,
          bill_requested, and cleaning as guests arrive, order, and leave.
        </p>
      </div>

      {branches?.map((branch) => (
        <Card key={branch.id}>
          <CardHeader>
            <CardTitle>{branch.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branch.restaurant_tables.map((table) => (
                <div
                  key={table.id}
                  className="flex flex-col gap-2 rounded-md border p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{table.label}</p>
                    <span className="text-xs capitalize text-muted-foreground">
                      {table.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{table.seats} seats</p>

                  {table.status === "cleaning" && (
                    <form action={markTableCleaned.bind(null, table.id)}>
                      <button
                        type="submit"
                        className="mt-1 text-sm text-primary hover:underline"
                      >
                        Mark cleaned
                      </button>
                    </form>
                  )}
                </div>
              ))}
              {branch.restaurant_tables.length === 0 && (
                <p className="text-sm text-muted-foreground">No tables yet for this branch.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {(!branches || branches.length === 0) && (
        <p className="text-sm text-muted-foreground">No branches yet.</p>
      )}
    </div>
  );
}
