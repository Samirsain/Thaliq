import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RestaurantSettingsForm } from "@/components/dashboard/restaurant-settings-form";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { data } = await supabase
    .from("restaurants")
    .select(
      "name, phone, description, tax_percent, service_charge_percent, logo_url, cover_image_url, upi_id, upi_display_name",
    )
    .eq("id", restaurant.restaurantId)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Restaurant profile, tax and service charge.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {data ? (
            <RestaurantSettingsForm restaurant={data} restaurantId={restaurant.restaurantId} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
