import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_end, restaurants(name), subscription_plans(name, tier)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Subscriptions</h1>
        <p className="text-muted-foreground">Starter, Business and Pro subscriptions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(subscriptions ?? []).map((sub) => (
            <div key={sub.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div>
                <p className="font-medium">
                  {(sub.restaurants as unknown as { name: string } | null)?.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {(sub.subscription_plans as unknown as { name: string } | null)?.name}
                </p>
              </div>
              <Badge variant={sub.status === "active" ? "brand" : "outline"}>{sub.status}</Badge>
            </div>
          ))}
          {(!subscriptions || subscriptions.length === 0) && (
            <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
