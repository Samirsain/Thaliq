"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export type MenuActionState = { error: string | null };

export async function addMenuCategory(
  _prevState: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Category name is required." };

  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { error } = await supabase
    .from("menu_categories")
    .insert({ restaurant_id: restaurant.restaurantId, name });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/menu");
  return { error: null };
}

export async function addMenuItem(
  _prevState: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const basePrice = Number(formData.get("basePrice"));
  const isVeg = formData.get("isVeg") === "on";

  if (!categoryId || !name || Number.isNaN(basePrice)) {
    return { error: "Category, name and price are required." };
  }

  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { error } = await supabase.from("menu_items").insert({
    restaurant_id: restaurant.restaurantId,
    category_id: categoryId,
    name,
    base_price: basePrice,
    is_veg: isVeg,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/menu");
  return { error: null };
}

export async function toggleMenuItemAvailability(itemId: string, isAvailable: boolean) {
  await requireCurrentRestaurant();
  const supabase = await createClient();
  await supabase.from("menu_items").update({ is_available: isAvailable }).eq("id", itemId);
  revalidatePath("/dashboard/menu");
}
