"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentRestaurant } from "@/lib/restaurant";
import { hashPin, verifyPin } from "@/lib/staff-pin";
import { createClient } from "@/lib/supabase/server";

export type StaffActionState = { error: string | null };

/**
 * Only the unified "staff" role is offered for PIN accounts. Managers need
 * the full dashboard (Supabase Auth), which a PIN session cannot reach.
 */
const VALID_ROLES = ["staff"];

export async function addStaff(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const branchId = String(formData.get("branchId") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!name) return { error: "Name is required." };
  if (!VALID_ROLES.includes(role)) return { error: "Choose a valid role." };

  if (!/^\d{4}$/.test(pin)) {
    return { error: "PIN must be exactly 4 digits." };
  }

  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { data: sameRole } = await supabase
    .from("staff")
    .select("name, pin_hash")
    .eq("restaurant_id", restaurant.restaurantId)
    .eq("role", role)
    .eq("is_active", true);

  const clash = (sameRole ?? []).find((member) => verifyPin(pin, member.pin_hash));
  if (clash) {
    return {
      error: `${clash.name} already uses that PIN. Pick a different PIN.`,
    };
  }

  const { error } = await supabase.from("staff").insert({
    restaurant_id: restaurant.restaurantId,
    branch_id: branchId,
    name,
    role,
    pin_hash: hashPin(pin),
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { error: null };
}

/** Edits a staff member's display name. */
export async function editStaffName(
  staffId: string,
  name: string,
): Promise<StaffActionState> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { error } = await supabase
    .from("staff")
    .update({ name: trimmed })
    .eq("id", staffId)
    .eq("restaurant_id", restaurant.restaurantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { error: null };
}

/** Resets a staff member's PIN and invalidates all active sessions. */
export async function resetStaffPin(
  staffId: string,
  newPin: string,
): Promise<StaffActionState> {
  if (!/^\d{4}$/.test(newPin)) {
    return { error: "PIN must be exactly 4 digits." };
  }

  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { data: sameRole } = await supabase
    .from("staff")
    .select("name, pin_hash")
    .eq("restaurant_id", restaurant.restaurantId)
    .eq("role", "staff")
    .eq("is_active", true)
    .neq("id", staffId);

  const clash = (sameRole ?? []).find((member) => verifyPin(newPin, member.pin_hash));
  if (clash) {
    return { error: `${clash.name} already uses that PIN. Pick a different PIN.` };
  }

  const { data: current } = await supabase
    .from("staff")
    .select("session_version")
    .eq("id", staffId)
    .eq("restaurant_id", restaurant.restaurantId)
    .maybeSingle();

  if (!current) return { error: "Staff member not found." };

  const { error } = await supabase
    .from("staff")
    .update({
      pin_hash: hashPin(newPin),
      session_version: current.session_version + 1,
    })
    .eq("id", staffId)
    .eq("restaurant_id", restaurant.restaurantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { error: null };
}

/** Activates or deactivates a staff member. Deactivating invalidates sessions. */
export async function toggleStaffActive(
  staffId: string,
  active: boolean,
): Promise<StaffActionState> {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const update: Record<string, unknown> = { is_active: active };

  if (!active) {
    const { data: current } = await supabase
      .from("staff")
      .select("session_version")
      .eq("id", staffId)
      .eq("restaurant_id", restaurant.restaurantId)
      .maybeSingle();

    if (!current) return { error: "Staff member not found." };
    update.session_version = current.session_version + 1;
  }

  const { error } = await supabase
    .from("staff")
    .update(update)
    .eq("id", staffId)
    .eq("restaurant_id", restaurant.restaurantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { error: null };
}

/** Revokes all active sessions for a staff member by incrementing session_version. */
export async function revokeStaffSessions(
  staffId: string,
): Promise<StaffActionState> {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("staff")
    .select("session_version")
    .eq("id", staffId)
    .eq("restaurant_id", restaurant.restaurantId)
    .maybeSingle();

  if (!current) return { error: "Staff member not found." };

  const { error } = await supabase
    .from("staff")
    .update({ session_version: current.session_version + 1 })
    .eq("id", staffId)
    .eq("restaurant_id", restaurant.restaurantId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { error: null };
}
