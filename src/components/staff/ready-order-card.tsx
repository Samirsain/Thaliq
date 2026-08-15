"use client";

import { useTransition } from "react";

import { markOrderServed } from "@/app/actions/staff-ops";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OrderItem = { id: string; item_name: string; variant_name: string | null; quantity: number };

export function ReadyOrderCard({
  order,
}: {
  order: { id: string; order_number: number; tableLabel: string | null; order_items: OrderItem[] };
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="border-brand/50">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          {order.tableLabel ? `Table ${order.tableLabel}` : `Order #${order.order_number}`}
        </CardTitle>
        <span className="text-xs text-muted-foreground">#{order.order_number}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="text-sm">
          {order.order_items.map((item) => (
            <li key={item.id}>
              {item.item_name}
              {item.variant_name ? ` (${item.variant_name})` : ""} × {item.quantity}
            </li>
          ))}
        </ul>
        <Button
          variant="brand"
          disabled={isPending}
          onClick={() => startTransition(() => markOrderServed(order.id))}
        >
          {isPending ? "Updating…" : "Mark served"}
        </Button>
      </CardContent>
    </Card>
  );
}
