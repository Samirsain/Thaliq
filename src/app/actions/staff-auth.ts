"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { signStaffSession, STAFF_SESSION_COOKIE } from "@/lib/staff-session";
import { verifyPin } from "@/lib/staff-pin";

export type StaffLoginState = { error: string | null };

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;

const ROLE_HOME: Record<string, string> = {
  waiter: "/staff/waiter",
  kitchen: "/staff/kitchen",
  cashier: "/staff/cashier",
  staff: "/staff/orders",
};

/**
 * Resolves a restaurant code to its display name and active staff list, so
 * the sign-in screen can show "The Coffee House" and a list of staff names
 * before anyone taps a PIN.
 */
export async function lookupRestaurant(
  code: string,
): Promise<
  | { slug: string; name: string; staff: { id: string; name: string }[] }
  | { error: string }
> {
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

  const { data: staff } = await admin
    .from("staff")
    .select("id, name")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("name");

  return { slug: restaurant.slug, name: restaurant.name, staff: staff ?? [] };
}

export async function staffLogin(
  _prevState: StaffLoginState,
  formData: FormData,
): Promise<StaffLoginState> {
  const restaurantSlug = String(formData.get("restaurantSlug") ?? "").trim().toLowerCase();
  const staffId = String(formData.get("staffId") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!restaurantSlug) return { error: "Enter your restaurant code." };
  if (!staffId) return { error: "Select your name." };
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

  const { data: staff } = await admin
    .from("staff")
    .select(
      "id, name, branch_id, role, pin_hash, is_active, failed_attempts, locked_until, session_version",
    )
    .eq("id", staffId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  if (!staff || !staff.is_active) {
    return { error: "That staff member doesn't exist. Ask your manager to check." };
  }

  // Check lockout
  if (staff.locked_until && new Date(staff.locked_until) > new Date()) {
    const remaining = Math.ceil(
      (new Date(staff.locked_until).getTime() - Date.now()) / 60000,
    );
    return {
      error: `Too many attempts. Try again in ${remaining} minute${remaining !== 1 ? "s" : ""}.`,
    };
  }

  if (!verifyPin(pin, staff.pin_hash)) {
    const newAttempts = staff.failed_attempts + 1;
    const shouldLock = newAttempts >= MAX_ATTEMPTS;

    await admin
      .from("staff")
      .update({
        failed_attempts: newAttempts,
        locked_until: shouldLock
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString()
          : null,
      })
      .eq("id", staffId);

    if (shouldLock) {
      return { error: `Too many attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` };
    }

    const remaining = MAX_ATTEMPTS - newAttempts;
    return {
      error: `That PIN doesn't match. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    };
  }

  // Success: reset failed attempts
  await admin
    .from("staff")
    .update({ failed_attempts: 0, locked_until: null })
    .eq("id", staffId);

  let sessionToken: string;
  try {
    sessionToken = signStaffSession({
      staffId: staff.id,
      restaurantId: restaurant.id,
      branchId: staff.branch_id,
      role: staff.role as "waiter" | "kitchen" | "cashier" | "staff",
      name: staff.name,
      sessionVersion: staff.session_version,
    });
  } catch {
    return {
      error:
        "Staff sign-in isn't available right now. Please ask your manager to contact support.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(STAFF_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect(ROLE_HOME[staff.role] ?? "/staff/orders");
}

export async function staffLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_SESSION_COOKIE);
  redirect("/staff");
}
