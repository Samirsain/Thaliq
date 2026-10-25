import QRCode from "qrcode";

import { AddStaffForm } from "@/components/dashboard/add-staff-form";
import { StaffLoginCard } from "@/components/dashboard/staff-login-card";
import { StaffMemberCard } from "@/components/dashboard/staff-member-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicAppUrl } from "@/lib/app-url";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export default async function StaffPage() {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const loginUrl = `${publicAppUrl()}/staff?r=${restaurant.restaurantSlug}`;
  const loginQr = await QRCode.toDataURL(loginUrl, { margin: 1, width: 220 });

  const [{ data: branches }, { data: staff }] = await Promise.all([
    supabase.from("branches").select("id, name").eq("restaurant_id", restaurant.restaurantId),
    supabase
      .from("staff")
      .select("id, name, role, is_active, branches(name)")
      .eq("restaurant_id", restaurant.restaurantId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Staff</h1>
        <p className="text-muted-foreground">
          Staff members sign in with their name and a 4-digit PIN.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff sign-in</CardTitle>
          <CardDescription>How your team gets into THALIQ on their own phones.</CardDescription>
        </CardHeader>
        <CardContent>
          <StaffLoginCard
            loginUrl={loginUrl}
            qrDataUrl={loginQr}
            restaurantCode={restaurant.restaurantSlug}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add staff member</CardTitle>
          <CardDescription>
            Staff can operate the entire restaurant from one console. Managers need
            the full dashboard, which a PIN sign-in can&apos;t reach — give them an
            owner/manager account instead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {branches && branches.length > 0 ? (
            <AddStaffForm branches={branches} />
          ) : (
            <p className="text-sm text-muted-foreground">Create a branch first.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff Members</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(staff ?? []).map((member) => (
            <StaffMemberCard
              key={member.id}
              member={{
                id: member.id,
                name: member.name,
                role: member.role,
                is_active: member.is_active,
                branchName:
                  (member.branches as unknown as { name: string } | null)?.name ?? null,
              }}
            />
          ))}
          {(!staff || staff.length === 0) && (
            <p className="text-sm text-muted-foreground">No staff added yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
