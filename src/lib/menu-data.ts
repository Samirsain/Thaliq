import { createClient } from "@/lib/supabase/server";

export async function getMenuData(restaurantSlug: string, branchSlug: string) {
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, logo_url, description, cuisine_type")
    .eq("slug", restaurantSlug)
    .eq("status", "active")
    .maybeSingle();

  if (!restaurant) return null;

  const { data: branch } = await supabase
    .from("branches")
    .select("id, name, slug")
    .eq("restaurant_id", restaurant.id)
    .eq("slug", branchSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!branch) return null;

  const { data: categories } = await supabase
    .from("menu_categories")
    .select(
      "id, name, sort_order, menu_items(id, name, description, image_url, base_price, is_veg, is_bestseller, is_available)",
    )
    .eq("restaurant_id", restaurant.id)
    .order("sort_order");

  return { restaurant, branch, categories: categories ?? [] };
}

export async function resolveTable(branchId: string, tableId: string) {
  const supabase = await createClient();

  const { data: table } = await supabase
    .from("restaurant_tables")
    .select("id, label")
    .eq("id", tableId)
    .eq("branch_id", branchId)
    .maybeSingle();

  return table;
}
