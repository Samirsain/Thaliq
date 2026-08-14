import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type CurrentRestaurant = {
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  role: "owner" | "manager" | "waiter" | "kitchen" | "cashier";
};

/**
 * Resolves the signed-in owner/manager's restaurant context.
 * Redirects to /login if there is no session, and to /onboarding if the
 * user hasn't created a restaurant yet. A user can belong to more than one
 * restaurant in principle; the dashboard MVP operates on the first one.
 */
export async function requireCurrentRestaurant(): Promise<CurrentRestaurant> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("role, restaurants(id, name, slug)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.restaurants) {
    redirect("/onboarding");
  }

  const restaurant = membership.restaurants as unknown as {
    id: string;
    name: string;
    slug: string;
  };

  return {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantSlug: restaurant.slug,
    role: membership.role,
  };
}
