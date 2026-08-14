"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type OnboardingState = { error: string | null };

export async function createRestaurant(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const name = String(formData.get("name") ?? "").trim();
  const branchName = String(formData.get("branchName") ?? "").trim() || "Main Branch";
  const cuisineType = String(formData.get("cuisineType") ?? "").trim() || null;

  if (!name) {
    return { error: "Restaurant name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const baseSlug = slugify(name) || "restaurant";
  const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .insert({ owner_id: user.id, slug, name, cuisine_type: cuisineType })
    .select("id")
    .single();

  if (restaurantError || !restaurant) {
    return { error: restaurantError?.message ?? "Could not create restaurant." };
  }

  const { error: memberError } = await supabase
    .from("restaurant_members")
    .insert({ restaurant_id: restaurant.id, user_id: user.id, role: "owner" });

  if (memberError) {
    return { error: memberError.message };
  }

  const { error: branchError } = await supabase
    .from("branches")
    .insert({ restaurant_id: restaurant.id, slug: "main", name: branchName });

  if (branchError) {
    return { error: branchError.message };
  }

  redirect("/dashboard");
}
