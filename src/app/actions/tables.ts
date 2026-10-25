"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireCurrentRestaurant } from "@/lib/restaurant";

export async function createTable(formData: FormData) {
  const restaurant = await requireCurrentRestaurant();
  const admin = createAdminClient();

  const branchId = String(formData.get("branchId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const seats = Number(formData.get("seats") ?? "4");

  if (!branchId || !label) return;

  await admin.from("restaurant_tables").insert({
    branch_id: branchId,
    label,
    seats,
  });

  revalidatePath("/dashboard/tables");
}

export async function updateTableLabel(tableId: string, label: string) {
  const restaurant = await requireCurrentRestaurant();
  const admin = createAdminClient();

  await admin
    .from("restaurant_tables")
    .update({ label: label.trim() })
    .eq("id", tableId)
    .in(
      "branch_id",
      admin.from("branches").select("id").eq("restaurant_id", restaurant.restaurantId),
    );

  revalidatePath("/dashboard/tables");
}

/**
 * Marks a table as cleaned and available for the next guests.
 *
 * After payment (markBillPaid) the table goes to "cleaning". Without this
 * action, the table would stay in "cleaning" forever — there was no way to
 * transition it back to "available", so tables would pile up as "cleaning"
 * and never be assignable again.
 */
export async function markTableCleaned(tableId: string) {
  const restaurant = await requireCurrentRestaurant();
  const admin = createAdminClient();

  // Scope by restaurant via the branch join, and only transition from
  // "cleaning" so a concurrent update can't race us.
  const { data: branchIds } = await admin
    .from("branches")
    .select("id")
    .eq("restaurant_id", restaurant.restaurantId);

  if (!branchIds || branchIds.length === 0) return;

  await admin
    .from("restaurant_tables")
    .update({ status: "available" })
    .eq("id", tableId)
    .eq("status", "cleaning")
    .in(
      "branch_id",
      branchIds.map((b) => b.id),
    );

  revalidatePath("/dashboard/tables");
}
