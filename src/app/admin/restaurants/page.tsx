import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminRestaurantsPage() {
  const supabase = await createClient();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, slug, status, cuisine_type, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Restaurants</h1>
        <p className="text-muted-foreground">Every restaurant on THALIQ.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All restaurants</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(restaurants ?? []).map((restaurant) => (
            <div key={restaurant.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div>
                <p className="font-medium">{restaurant.name}</p>
                <p className="text-xs text-muted-foreground">/{restaurant.slug}</p>
              </div>
              <Badge variant={restaurant.status === "active" ? "brand" : "outline"}>
                {restaurant.status}
              </Badge>
            </div>
          ))}
          {(!restaurants || restaurants.length === 0) && (
            <p className="text-sm text-muted-foreground">No restaurants yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
