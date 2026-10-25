"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { markOrderReady, markOrderServed } from "@/app/actions/staff-ops";
import { CloseTabDialog } from "@/components/staff/close-tab-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  bill_requested: "Ready to Pay",
  payment_pending: "Payment Pending",
};

const STATUS_VARIANT: Record<string, "default" | "brand" | "secondary" | "destructive" | "outline"> = {
  open: "secondary",
  bill_requested: "destructive",
  payment_pending: "destructive",
};

type OrderItem = { id: string; item_name: string; variant_name: string | null; quantity: number };

type OrderRound = {
  id: string;
  order_number: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

type Bill = { id: string; status: string; total_amount: number } | null;

function ageLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function RoundSection({
  round,
  actionLabel,
  action,
}: {
  round: OrderRound;
  actionLabel?: string;
  action?: (id: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>#{round.order_number} · {timeLabel(round.created_at)}</span>
        <span>{ageLabel(round.created_at)}</span>
      </div>
      <ul className="mt-1.5 text-sm">
        {round.order_items.map((item) => (
          <li key={item.id}>
            {item.item_name}{item.variant_name ? ` (${item.variant_name})` : ""} × {item.quantity}
          </li>
        ))}
      </ul>
      {actionLabel && action && (
        <Button
          size="sm"
          className="mt-2 w-full"
          disabled={isPending}
          onClick={() => startTransition(() => action(round.id))}
        >
          {isPending ? "Updating…" : actionLabel}
        </Button>
      )}
    </div>
  );
}

export function TableSessionCard({
  session,
}: {
  session: {
    id: string;
    status: string;
    tableLabel: string;
    openedAt: string;
    rounds: OrderRound[];
    runningTotal: number;
    bill: Bill;
  };
}) {
  const [showCompleted, setShowCompleted] = useState(false);

  const newRounds = session.rounds.filter((r) =>
    ["pending", "accepted", "preparing"].includes(r.status)
  );
  const readyRounds = session.rounds.filter((r) => r.status === "ready");
  const completedRounds = session.rounds.filter((r) =>
    ["served", "completed"].includes(r.status)
  );
  const completedItemCount = completedRounds.reduce(
    (sum, r) => sum + r.order_items.length,
    0
  );

  const sessionAge = ageLabel(session.openedAt);
  const readyToPay =
    session.status === "bill_requested" ||
    session.status === "payment_pending";

  return (
    <Card className={readyToPay ? "border-destructive" : undefined}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Table {session.tableLabel}</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{sessionAge}</span>
          <Badge variant={STATUS_VARIANT[session.status] ?? "secondary"}>
            {STATUS_LABEL[session.status] ?? session.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {readyToPay && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {session.status === "bill_requested" ? "Pay at Counter" : "Payment Pending"}
          </div>
        )}

        {newRounds.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">New</p>
            {newRounds.map((round) => (
              <RoundSection key={round.id} round={round} actionLabel="Mark Ready" action={markOrderReady} />
            ))}
          </div>
        )}

        {readyRounds.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Ready</p>
            {readyRounds.map((round) => (
              <RoundSection key={round.id} round={round} actionLabel="Mark Served" action={markOrderServed} />
            ))}
          </div>
        )}

        {completedRounds.length > 0 && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground"
            >
              <span>Completed ({completedItemCount})</span>
              {showCompleted ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {showCompleted && (
              <div className="flex flex-col gap-2">
                {completedRounds.map((round) => (
                  <RoundSection key={round.id} round={round} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-2 text-sm">
          <span className="text-muted-foreground">Running total</span>
          <span className="font-medium">₹{session.runningTotal}</span>
        </div>

        <CloseTabDialog
          sessionId={session.id}
          tableLabel={session.tableLabel}
          runningTotal={session.runningTotal}
        />
      </CardContent>
    </Card>
  );
}
