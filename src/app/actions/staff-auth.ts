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

export async function staffLogin(
  _prevState: StaffLoginState,
  formData: FormData,
): Promise<StaffLoginState> {
  const restaurantSlug = String(formData.get("restaurantSlug") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!restaurantSlug || !role || !pin) {
    return { error: "Restaurant, role and PIN are all required." };
  }

  const admin = createAdminClient();

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id")
    .eq("slug", restaurantSlug)
    .eq("status", "active")
    .maybeSingle();

  if (!restaurant) {
    return { error: "Restaurant not found." };
  }

  const { data: candidates } = await admin
    .from("staff")
    .select("id, name, branch_id, pin_hash")
    .eq("restaurant_id", restaurant.id)
    .eq("role", role)
    .eq("is_active", true);

  const match = (candidates ?? []).find((candidate) => verifyPin(pin, candidate.pin_hash));

  if (!match) {
    return { error: "Incorrect PIN." };
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

  redirect(ROLE_HOME[role] ?? "/staff");
}

export async function staffLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_SESSION_COOKIE);
  redirect("/staff");
}
