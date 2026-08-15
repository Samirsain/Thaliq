import QRCode from "qrcode";

import { AutoRefresh } from "@/components/auto-refresh";
import { BillCard } from "@/components/staff/bill-card";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffSession } from "@/lib/staff-session";
import { staffLogout } from "@/app/actions/staff-auth";
import { buildUpiUri } from "@/lib/upi";

export default async function CashierPage() {
  const session = await requireStaffSession("cashier");
  const admin = createAdminClient();

  let query = admin
    .from("bills")
    .select("id, total_amount, table_sessions(restaurant_tables(label))")
    .neq("status", "paid")
    .eq("restaurant_id", session.restaurantId)
    .order("created_at");

  if (session.branchId) {
    query = query.eq("branch_id", session.branchId);
  }

  const [{ data: bills }, { data: restaurant }] = await Promise.all([
    query,
    admin
      .from("restaurants")
      .select("name, upi_id, upi_display_name")
      .eq("id", session.restaurantId)
      .maybeSingle(),
  ]);

  const cards = await Promise.all(
    (bills ?? []).map(async (bill) => {
      const tableLabel =
        (bill.table_sessions as unknown as { restaurant_tables: { label: string } } | null)
          ?.restaurant_tables.label ?? "—";

      let upiQrDataUrl: string | null = null;
      if (restaurant?.upi_id) {
        const uri = buildUpiUri({
          upiId: restaurant.upi_id,
          payeeName: restaurant.upi_display_name || restaurant.name,
          amount: bill.total_amount,
          note: `Table ${tableLabel}`,
        });
        upiQrDataUrl = await QRCode.toDataURL(uri, { margin: 1, width: 320 });
      }

      return { id: bill.id, total_amount: bill.total_amount, tableLabel, upiQrDataUrl };
    }),
  );

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-muted/20 p-4 sm:p-6">
      <AutoRefresh intervalMs={5000} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cashier</h1>
          <p className="text-muted-foreground">{session.name}</p>
        </div>
        <form action={staffLogout}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((bill) => (
          <BillCard key={bill.id} bill={bill} />
        ))}
        {cards.length === 0 && <p className="text-sm text-muted-foreground">No open bills.</p>}
      </div>
    </div>
  );
}
