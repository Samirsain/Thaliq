"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const VALID_TYPES = ["call_waiter", "water", "cutlery", "bill", "other"];

export async function requestWaiterAssistance(
  branchId: string,
  tableId: string,
  type: string,
): Promise<{ error: string | null }> {
  if (!VALID_TYPES.includes(type)) {
    return { error: "Invalid request type." };
  }

  const admin = createAdminClient();

  const { data: table } = await admin
    .from("restaurant_tables")
    .select("id, branches(restaurant_id)")
    .eq("id", tableId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (!table) {
    return { error: "Table not found." };
  }

  const { error } = await admin.from("waiter_requests").insert({ branch_id: branchId, table_id: tableId, type });

  if (type === "bill") {
    await admin.from("restaurant_tables").update({ status: "bill_requested" }).eq("id", tableId);
    await raiseBillForTable(admin, branchId, tableId, (table.branches as unknown as { restaurant_id: string }).restaurant_id);
  }

  return { error: error?.message ?? null };
}

async function raiseBillForTable(
  admin: ReturnType<typeof createAdminClient>,
  branchId: string,
  tableId: string,
  restaurantId: string,
) {
  // Match both "open" and "bill_requested" sessions. Previously this only
  // matched "open", so a customer who requested the bill, placed another
  // order (joining the "bill_requested" session), and then requested the
  // bill again would get a stale total — the session lookup would fail
  // and the bill would never be updated with the new order's amount.
  const { data: session } = await admin
    .from("table_sessions")
    .select("id")
    .eq("table_id", tableId)
    .in("status", ["open", "bill_requested"])
    .maybeSingle();

  if (!session) return;

  const { data: orders } = await admin
    .from("orders")
    .select("total_amount")
    .eq("table_session_id", session.id)
    .neq("status", "cancelled");

  const totalAmount = (orders ?? []).reduce((sum, o) => sum + o.total_amount, 0);

  const { data: existingBill } = await admin
    .from("bills")
    .select("id")
    .eq("table_session_id", session.id)
    .neq("status", "paid")
    .maybeSingle();

  if (existingBill) {
    await admin
      .from("bills")
      .update({ status: "requested", total_amount: totalAmount })
      .eq("id", existingBill.id);
  } else {
    await admin.from("bills").insert({
      restaurant_id: restaurantId,
      branch_id: branchId,
      table_session_id: session.id,
      status: "requested",
      total_amount: totalAmount,
    });
  }

  await admin.from("table_sessions").update({ status: "bill_requested" }).eq("id", session.id);
}
