import { AddCategoryForm } from "@/components/dashboard/add-category-form";
import { AddItemForm } from "@/components/dashboard/add-item-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export default async function MenuPage() {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("menu_categories")
    .select("id, name, menu_items(id, name, base_price, is_veg, is_available)")
    .eq("restaurant_id", restaurant.restaurantId)
    .order("sort_order");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Menu</h1>
        <p className="text-muted-foreground">Categories, items and pricing.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a category</CardTitle>
          </CardHeader>
          <CardContent>
            <AddCategoryForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add an item</CardTitle>
          </CardHeader>
          <CardContent>
            {categories && categories.length > 0 ? (
              <AddItemForm categories={categories} />
            ) : (
              <p className="text-sm text-muted-foreground">Create a category first.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        {(categories ?? []).map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="text-base">{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {category.menu_items.length === 0 && (
                <p className="text-sm text-muted-foreground">No items yet.</p>
              )}
              {category.menu_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b py-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2.5 rounded-sm border ${item.is_veg ? "border-green-600 bg-green-600" : "border-red-600 bg-red-600"}`}
                    />
                    <span>{item.name}</span>
                    {!item.is_available && <Badge variant="outline">Unavailable</Badge>}
                  </div>
                  <span className="font-medium">₹{item.base_price}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        {(!categories || categories.length === 0) && (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
