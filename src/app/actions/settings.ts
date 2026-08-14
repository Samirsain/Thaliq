"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionState = { error: string | null; success: boolean };

export async function updateRestaurantProfile(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const taxPercent = Number(formData.get("taxPercent") ?? 0);
  const serviceChargePercent = Number(formData.get("serviceChargePercent") ?? 0);

  if (!name) {
    return { error: "Restaurant name is required.", success: false };
  }

  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { error } = await supabase
    .from("restaurants")
    .update({
      name,
      phone,
      description,
      tax_percent: Number.isFinite(taxPercent) ? taxPercent : 0,
      service_charge_percent: Number.isFinite(serviceChargePercent) ? serviceChargePercent : 0,
    })
    .eq("id", restaurant.restaurantId);

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath("/dashboard/settings");
  return { error: null, success: true };
}
