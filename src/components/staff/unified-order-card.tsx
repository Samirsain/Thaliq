"use client";

import { useTransition } from "react";

import { advanceOrderStatusUnified } from "@/app/actions/staff-ops";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTION_LABEL: Record<string, string> = {
  pending: "Start preparing",
  preparing: "Mark ready",
  ready: "Mark served",
};

type OrderItem = { id: string; item_name: string; variant_name: string | null; quantity: number };

function ageLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export function UnifiedOrderCard({
  order,
}: {
  order: {
    id: string;
    order_number: number;
    status: string;
    statusLabel: string;
    created_at: string;
    order_items: OrderItem[];
    tableLabel: string | null;
  };
}) {
  const [isPending, startTransition] = useTransition();
  const actionLabel = ACTION_LABEL[order.status];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          {order.tableLabel ? `Table ${order.tableLabel}` : `Order #${order.order_number}`}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{ageLabel(order.created_at)}</span>
          <Badge>{order.statusLabel}</Badge>
        </div>
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
        {actionLabel ? (
          <Button
            disabled={isPending}
            onClick={() => startTransition(() => advanceOrderStatusUnified(order.id))}
          >
            {isPending ? "Updating…" : actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
