"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export type BrandingActionState = { error: string | null; success: boolean };

const HEX = /^#[0-9a-fA-F]{6}$/;

const FONTS = ["sans", "serif", "mono"];

export async function updateBranding(
  _prevState: BrandingActionState,
  formData: FormData,
): Promise<BrandingActionState> {
  const templateId = String(formData.get("templateId") ?? "") || null;
  const primaryColor = String(formData.get("primaryColor") ?? "").trim();
  const fontFamily = String(formData.get("fontFamily") ?? "").trim();

  if (primaryColor && !HEX.test(primaryColor)) {
    return { error: "Brand colour must be a hex value like #C2410C.", success: false };
  }

  if (fontFamily && !FONTS.includes(fontFamily)) {
    return { error: "Unknown font.", success: false };
  }

  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  if (templateId) {
    // Reject a template id that isn't a real template rather than storing a
    // dangling reference.
    const { data: template } = await supabase
      .from("templates")
      .select("id")
      .eq("id", templateId)
      .maybeSingle();

    if (!template) {
      return { error: "That template no longer exists.", success: false };
    }
  }

  const { error } = await supabase.from("restaurant_themes").upsert(
    {
      restaurant_id: restaurant.restaurantId,
      template_id: templateId,
      primary_color: primaryColor || null,
      font_family: fontFamily || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "restaurant_id" },
  );

  if (error) return { error: error.message, success: false };

  revalidatePath("/dashboard/branding");
  return { error: null, success: true };
}
