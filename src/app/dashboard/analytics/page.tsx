import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentRestaurant } from "@/lib/restaurant";

const SECTIONS = [
  { title: "Revenue", description: "Today, week, month, custom range" },
  { title: "Orders", description: "Total, completed, cancelled, pending" },
  { title: "Products", description: "Best selling, lowest selling, most viewed" },
  { title: "Customers", description: "New vs. returning" },
  { title: "Offers", description: "Usage, discount amount, revenue generated" },
];

export default async function AnalyticsPage() {
  await requireCurrentRestaurant();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-muted-foreground">Insights populate automatically as orders come in.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{section.description}</p>
              <p className="mt-4 text-2xl font-semibold text-muted-foreground/60">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
