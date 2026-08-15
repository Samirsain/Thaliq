import { AutoRefresh } from "@/components/auto-refresh";
import { WaiterRequestCard } from "@/components/staff/waiter-request-card";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffSession } from "@/lib/staff-session";
import { staffLogout } from "@/app/actions/staff-auth";

export default async function WaiterPage() {
  const session = await requireStaffSession("waiter");
  const admin = createAdminClient();

  let query = admin
    .from("waiter_requests")
    .select("id, type, restaurant_tables(label)")
    .is("resolved_at", null)
    .order("created_at");

  if (session.branchId) {
    query = query.eq("branch_id", session.branchId);
  }

  const { data: requests } = await query;

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-muted/20 p-6">
      <AutoRefresh intervalMs={4000} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Waiter</h1>
          <p className="text-muted-foreground">{session.name}</p>
        </div>
        <form action={staffLogout}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(requests ?? []).map((request) => (
          <WaiterRequestCard
            key={request.id}
            request={{
              id: request.id,
              type: request.type,
              tableLabel: (request.restaurant_tables as unknown as { label: string } | null)?.label ?? "—",
            }}
          />
        ))}
        {(!requests || requests.length === 0) && (
          <p className="text-sm text-muted-foreground">No open requests.</p>
        )}
      </div>
    </div>
  );
}
