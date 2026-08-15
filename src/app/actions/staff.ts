"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentRestaurant } from "@/lib/restaurant";
import { hashPin, verifyPin } from "@/lib/staff-pin";
import { createClient } from "@/lib/supabase/server";

export type StaffActionState = { error: string | null };

/**
 * PIN accounts are for floor roles only.
 *
 * "manager" is deliberately absent even though PRD section 7 lists it on the
 * PIN screen: a manager's job (menu, staff, analytics — section 39) lives in
 * the Supabase-Auth dashboard, which a PIN session cannot reach. Offering it
 * here would create accounts that can be made but never signed into. Managers
 * get a real email/password account instead.
 */
const VALID_ROLES = ["waiter", "kitchen", "cashier"];

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

  // Exactly 4 digits: the staff login keypad (PRD section 7's ● ● ● ●) is a
  // fixed 4-dot pad, so a longer PIN would be impossible to type in.
  if (!/^\d{4}$/.test(pin)) {
    return { error: "PIN must be exactly 4 digits." };
  }

  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  // Sign-in matches on restaurant + role + PIN, so two people sharing a PIN
  // within the same role would be indistinguishable — whoever the query
  // returned first would get the credit for every order they touch. Reject
  // the collision at creation rather than mis-attributing work later.
  const { data: sameRole } = await supabase
    .from("staff")
    .select("name, pin_hash")
    .eq("restaurant_id", restaurant.restaurantId)
    .eq("role", role)
    .eq("is_active", true);

  const clash = (sameRole ?? []).find((member) => verifyPin(pin, member.pin_hash));
  if (clash) {
    return {
      error: `${clash.name} already uses that PIN for the ${role} role. Pick a different PIN.`,
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
