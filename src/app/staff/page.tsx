import type { Metadata } from "next";

import { StaffLoginForm } from "@/components/staff/staff-login-form";

export const metadata: Metadata = { title: "Staff sign in — THALIQ" };

export default async function StaffLoginPage(props: PageProps<"/staff">) {
  const searchParams = await props.searchParams;
  const restaurantSlug = typeof searchParams.r === "string" ? searchParams.r : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <StaffLoginForm defaultRestaurantSlug={restaurantSlug} />
    </div>
  );
}
