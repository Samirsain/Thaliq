"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffSession } from "@/lib/staff-session";

const KITCHEN_NEXT_STATUS: Record<string, string> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
};

export async function advanceOrderStatus(orderId: string) {
  const session = await requireStaffSession("kitchen");
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, status, restaurant_id")
    .eq("id", orderId)
    .eq("restaurant_id", session.restaurantId)
    .single();

  if (!order) return;

  const nextStatus = KITCHEN_NEXT_STATUS[order.status];
  if (!nextStatus) return;

  await admin.from("orders").update({ status: nextStatus }).eq("id", orderId);
  await admin.from("order_status_history").insert({
    order_id: orderId,
    status: nextStatus,
    changed_by_staff_id: session.staffId,
  });

  revalidatePath("/staff/kitchen");
}

export async function resolveWaiterRequest(requestId: string) {
  const session = await requireStaffSession("waiter");
  const admin = createAdminClient();

  await admin
    .from("waiter_requests")
    .update({ resolved_at: new Date().toISOString(), resolved_by_staff_id: session.staffId })
    .eq("id", requestId)
    .eq("branch_id", session.branchId ?? "");

  revalidatePath("/staff/waiter");
}

export async function markBillPaid(billId: string, method: "cash" | "upi" | "card") {
  const session = await requireStaffSession("cashier");
  const admin = createAdminClient();

  const { data: bill } = await admin
    .from("bills")
    .select("id, total_amount, restaurant_id, table_session_id")
    .eq("id", billId)
    .eq("restaurant_id", session.restaurantId)
    .single();

  if (!bill) return;

  await admin
    .from("bills")
    .update({ status: "paid", closed_at: new Date().toISOString() })
    .eq("id", billId);

  await admin.from("payments").insert({
    restaurant_id: session.restaurantId,
    bill_id: billId,
    method,
    status: "paid",
    amount: bill.total_amount,
    recorded_by_staff_id: session.staffId,
  });

  if (bill.table_session_id) {
    await admin
      .from("table_sessions")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", bill.table_session_id);
  }

  revalidatePath("/staff/cashier");
}
