import QRCode from "qrcode";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentRestaurant } from "@/lib/restaurant";
import { createClient } from "@/lib/supabase/server";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export default async function QrPage() {
  const restaurant = await requireCurrentRestaurant();
  const supabase = await createClient();

  const { data: branches } = await supabase
    .from("branches")
    .select("id, slug, name, restaurant_tables(id, label)")
    .eq("restaurant_id", restaurant.restaurantId);

  const branchCards = await Promise.all(
    (branches ?? []).map(async (branch) => {
      const generalUrl = `${siteUrl()}/menu/${restaurant.restaurantSlug}/${branch.slug}`;
      const generalQr = await QRCode.toDataURL(generalUrl, { margin: 1, width: 160 });

      const tableQrs = await Promise.all(
        branch.restaurant_tables.map(async (table) => {
          const url = `${siteUrl()}/menu/${restaurant.restaurantSlug}/${branch.slug}/${table.id}`;
          const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 160 });
          return { id: table.id, label: table.label, url, dataUrl };
        }),
      );

      return { ...branch, generalUrl, generalQr, tableQrs };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">QR Codes</h1>
        <p className="text-muted-foreground">
          Table QR codes route straight to a pre-identified table. Menu changes never require
          reprinting.
        </p>
      </div>

      {branchCards.map((branch) => (
        <Card key={branch.id}>
          <CardHeader>
            <CardTitle className="text-base">{branch.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4 border-b pb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={branch.generalQr} alt="General menu QR" className="size-24 rounded" />
              <div>
                <p className="font-medium">General menu QR</p>
                <p className="text-xs break-all text-muted-foreground">{branch.generalUrl}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branch.tableQrs.map((table) => (
                <div key={table.id} className="flex items-center gap-3 rounded-md border p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={table.dataUrl} alt={`QR for ${table.label}`} className="size-16 rounded" />
                  <div>
                    <p className="text-sm font-medium">{table.label}</p>
                    <p className="text-xs break-all text-muted-foreground">{table.url}</p>
                  </div>
                </div>
              ))}
              {branch.tableQrs.length === 0 && (
                <p className="text-sm text-muted-foreground">No tables yet for this branch.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {(!branches || branches.length === 0) && (
        <p className="text-sm text-muted-foreground">No branches yet.</p>
      )}
    </div>
  );
}
