import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminTemplatesPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase.from("templates").select("id, name, slug, is_premium");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="text-muted-foreground">Menu templates available to restaurants.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(templates ?? []).map((template) => (
          <Card key={template.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{template.name}</CardTitle>
              {template.is_premium ? <Badge variant="brand">Premium</Badge> : <Badge variant="outline">Free</Badge>}
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">/{template.slug}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
