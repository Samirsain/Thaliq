import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateRestaurantForm } from "@/components/onboarding/create-restaurant-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set up your restaurant — THALIQ" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <CreateRestaurantForm />
    </div>
  );
}
