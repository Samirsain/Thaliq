"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export type TableActionState = { error: string | null };

export async function addTable(
  _prevState: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const branchId = String(formData.get("branchId") ?? "");
  const label = String(formData.get("label") ?? "").trim();

  if (!branchId || !label) {
    return { error: "Branch and table label are required." };
  }

  await requireCurrentRestaurant();
  const supabase = await createClient();

  const { error } = await supabase.from("restaurant_tables").insert({ branch_id: branchId, label });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/tables");
  return { error: null };
}
