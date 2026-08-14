"use client";

import { useTransition } from "react";

import { advanceOrderStatus } from "@/app/actions/staff-ops";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTION_LABEL: Record<string, string> = {
  pending: "Accept",
  accepted: "Start preparing",
  preparing: "Mark ready",
};

type OrderItem = { id: string; item_name: string; quantity: number };

export function KitchenOrderCard({
  order,
}: {
  order: { id: string; order_number: number; status: string; order_items: OrderItem[]; tableLabel: string | null };
}) {
  const [isPending, startTransition] = useTransition();
  const actionLabel = ACTION_LABEL[order.status];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          {order.tableLabel ? `Table ${order.tableLabel}` : `Order #${order.order_number}`}
        </CardTitle>
        <Badge>{order.status}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="text-sm">
          {order.order_items.map((item) => (
            <li key={item.id}>
              {item.item_name} × {item.quantity}
            </li>
          ))}
        </ul>
        {actionLabel ? (
          <Button
            disabled={isPending}
            onClick={() => startTransition(() => advanceOrderStatus(order.id))}
          >
            {isPending ? "Updating…" : actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
