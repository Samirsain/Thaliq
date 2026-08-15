"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentRestaurant } from "@/lib/restaurant";
import { hashPin } from "@/lib/staff-pin";
import { createClient } from "@/lib/supabase/server";

export type StaffActionState = { error: string | null };

const VALID_ROLES = ["manager", "waiter", "kitchen", "cashier"];

export async function addStaff(
  _prevState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const branchId = String(formData.get("branchId") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!name || !VALID_ROLES.includes(role)) {
    return { error: "Name and a valid role are required." };
  }

  // Exactly 4 digits: the staff login keypad (PRD section 7's ● ● ● ●) is a
  // fixed 4-dot pad, so a longer PIN would be impossible to type in.
  if (!/^\d{4}$/.test(pin)) {
    return { error: "PIN must be exactly 4 digits." };
  }

  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

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
