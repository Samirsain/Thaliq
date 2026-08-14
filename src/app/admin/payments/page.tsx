import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, amount, status, created_at, subscriptions(restaurants(name))")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-muted-foreground">Subscription billing transactions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(transactions ?? []).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div>
                <p className="font-medium">
                  {(tx.subscriptions as unknown as { restaurants: { name: string } } | null)
                    ?.restaurants.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tx.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">₹{tx.amount}</span>
                <Badge variant={tx.status === "paid" ? "brand" : "outline"}>{tx.status}</Badge>
              </div>
            </div>
          ))}
          {(!transactions || transactions.length === 0) && (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
