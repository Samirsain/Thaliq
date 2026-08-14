import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export default async function OffersPage() {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from("offers")
    .select("id, name, type, is_active")
    .eq("restaurant_id", restaurant.restaurantId)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Offers</h1>
        <p className="text-muted-foreground">
          Percentage, flat, BOGO, combo, happy-hour and coupon offers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your offers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(offers ?? []).map((offer) => (
            <div key={offer.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div>
                <p className="font-medium">{offer.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{offer.type.replace("_", " ")}</p>
              </div>
              <Badge variant={offer.is_active ? "brand" : "outline"}>
                {offer.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
          {(!offers || offers.length === 0) && (
            <p className="text-sm text-muted-foreground">
              No offers yet. The offer builder (rules, coupons, happy hours) is on the roadmap —
              for now offers can be created directly in Supabase or via the API.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
