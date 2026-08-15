import { createClient } from "@/lib/supabase/server";

export async function getMenuData(restaurantSlug: string, branchSlug: string) {
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(
      "id, name, slug, logo_url, cover_image_url, description, cuisine_type, tax_percent, service_charge_percent",
    )
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

  const { data: theme } = await supabase
    .from("restaurant_themes")
    .select("primary_color, font_family, templates(slug)")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  const { data: categories } = await supabase
    .from("menu_categories")
    .select(
      `id, name, sort_order,
       menu_items(
         id, name, description, image_url, base_price, is_veg, is_bestseller, is_available,
         menu_variants(id, name, price, is_default, sort_order),
         menu_addons(id, name, price, sort_order)
       )`,
    )
    .eq("restaurant_id", restaurant.id)
    .order("sort_order");

  const templateSlug =
    (theme?.templates as unknown as { slug: string } | null)?.slug ?? null;

  return {
    restaurant,
    branch,
    categories: categories ?? [],
    theme: {
      templateSlug,
      primaryColor: theme?.primary_color ?? null,
      fontFamily: theme?.font_family ?? null,
    },
  };
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
