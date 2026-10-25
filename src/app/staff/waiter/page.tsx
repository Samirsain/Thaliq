import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaffSession } from "@/lib/staff-session";

export default async function WaiterPage() {
  const session = await getCurrentStaffSession("waiter");
  const supabase = await createClient();

  let branchIds: string[] = [];

  if (session.branchId) {
    branchIds = [session.branchId];
  } else {
    // Owners/managers (branchId = null) see all branches of their restaurant.
    // Previously this passed an empty array to .in(), which Supabase treats
    // as "no filter" — leaking every unresolved waiter request across ALL
    // restaurants on the platform.
    const { data: branches } = await supabase
      .from("branches")
      .select("id")
      .eq("restaurant_id", session.restaurantId);

    branchIds = (branches ?? []).map((b) => b.id);
  }

  // Guard: if the restaurant has no branches yet, don't query at all —
  // .in("branch_id", []) would return no rows, but it's clearer to short
  // circuit and show the empty state.
  if (branchIds.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Waiter Console</h1>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No branches set up yet. Ask your manager to add a branch first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: requests } = await supabase
    .from("waiter_requests")
    .select("id, table_id, request_type, created_at, resolved_at, restaurant_tables(label)")
    .in("branch_id", branchIds)
    .is("resolved_at", null)
    .order("created_at", { ascending: false });

  const { data: readyOrders } = await supabase
    .from("orders")
    .select("id, order_number, table_session_id, table_sessions(table_id, restaurant_tables(label))")
    .eq("restaurant_id", session.restaurantId)
    .eq("status", "ready")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Waiter Console</h1>
        <p className="text-muted-foreground">Welcome, {session.name}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests && requests.length > 0 ? (
            <ul className="divide-y">
              {requests.map((req) => (
                <li key={req.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">
                      {(req.restaurant_tables as { label: string } | null)?.label ?? "Unknown table"}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {req.request_type} · {new Date(req.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <form action={resolveWaiterRequest.bind(null, req.id)}>
                    <button type="submit" className="text-sm text-primary hover:underline">
                      Resolve
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ready to Serve</CardTitle>
        </CardHeader>
        <CardContent>
          {readyOrders && readyOrders.length > 0 ? (
            <ul className="divide-y">
              {readyOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Order #{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {(order.table_sessions as { restaurant_tables: { label: string } | null } | null)
                        ?.restaurant_tables?.label ?? "Pickup"}
                    </p>
                  </div>
                  <form action={markOrderServed.bind(null, order.id)}>
                    <button type="submit" className="text-sm text-primary hover:underline">
                      Mark served
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No orders ready to serve.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
