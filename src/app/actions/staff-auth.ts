"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { signStaffSession, STAFF_SESSION_COOKIE } from "@/lib/staff-session";
import { verifyPin } from "@/lib/staff-pin";

export type StaffLoginState = { error: string | null };

const ROLE_HOME: Record<string, string> = {
  waiter: "/staff/waiter",
  kitchen: "/staff/kitchen",
  cashier: "/staff/cashier",
};

/**
 * Resolves a restaurant code to its display name, so the sign-in screen can
 * confirm "The Coffee House" before anyone starts tapping a PIN.
 */
export async function lookupRestaurant(
  code: string,
): Promise<{ slug: string; name: string } | { error: string }> {
  const slug = code.trim().toLowerCase();
  if (!slug) return { error: "Enter your restaurant code." };

  const admin = createAdminClient();
  const { data: restaurant } = await admin
    .from("restaurants")
    .select("slug, name, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant || restaurant.status !== "active") {
    return { error: "No restaurant found with that code. Ask your manager to check it." };
  }

  return { slug: restaurant.slug, name: restaurant.name };
}

export async function staffLogin(
  _prevState: StaffLoginState,
  formData: FormData,
): Promise<StaffLoginState> {
  const restaurantSlug = String(formData.get("restaurantSlug") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!restaurantSlug) return { error: "Enter your restaurant code." };
  if (!ROLE_HOME[role]) return { error: "Choose your role." };
  if (!/^\d{4}$/.test(pin)) return { error: "Enter your 4-digit PIN." };

  const admin = createAdminClient();

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id")
    .eq("slug", restaurantSlug)
    .eq("status", "active")
    .maybeSingle();

  if (!restaurant) {
    return { error: "No restaurant found with that code. Ask your manager to check it." };
  }

  const { data: candidates } = await admin
    .from("staff")
    .select("id, name, branch_id, pin_hash")
    .eq("restaurant_id", restaurant.id)
    .eq("role", role)
    .eq("is_active", true);

  if (!candidates || candidates.length === 0) {
    return { error: `No ${role} accounts set up yet. Ask your manager to add you.` };
  }

  const match = candidates.find((candidate) => verifyPin(pin, candidate.pin_hash));

  if (!match) {
    return { error: "That PIN doesn't match. Try again or ask your manager." };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    STAFF_SESSION_COOKIE,
    signStaffSession({
      staffId: match.id,
      restaurantId: restaurant.id,
      branchId: match.branch_id,
      role: role as "waiter" | "kitchen" | "cashier",
      name: match.name,
    }),
    { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 12 },
  );

  redirect(ROLE_HOME[role]);
}

export async function staffLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_SESSION_COOKIE);
  redirect("/staff");
}
