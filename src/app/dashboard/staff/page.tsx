import { AddStaffForm } from "@/components/dashboard/add-staff-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

export default async function StaffPage() {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

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
        <p className="text-muted-foreground">Waiters, kitchen and cashier accounts sign in with a role + PIN.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add staff</CardTitle>
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
          <CardTitle className="text-base">Team</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(staff ?? []).map((member) => (
            <div key={member.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(member.branches as unknown as { name: string } | null)?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {member.role}
                </Badge>
                {!member.is_active && <Badge variant="destructive">Inactive</Badge>}
              </div>
            </div>
          ))}
          {(!staff || staff.length === 0) && (
            <p className="text-sm text-muted-foreground">No staff added yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
