"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelPaymentInitiation, confirmPayment, initiatePayment } from "@/app/actions/staff-ops";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI / Other" },
] as const;

export function PaymentControls({
  bill,
  sessionStatus,
}: {
  bill: { id: string; status: string; total_amount: number };
  sessionStatus: string;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("cash");
  const [isPending, startTransition] = useTransition();

  if (sessionStatus === "payment_pending") {
    return (
      <div className="flex flex-col gap-2 border-t pt-3">
        <p className="text-sm font-medium text-muted-foreground">
          Confirm payment · ₹{bill.total_amount}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              className={cn(
                "rounded-md border px-2 py-2 text-sm font-medium transition-colors",
                method === m.value ? "border-brand bg-brand text-brand-foreground" : "hover:bg-accent",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              await confirmPayment(bill.id, method);
              router.refresh();
            })}
          >
            {isPending ? "Saving…" : `Confirm · ${METHODS.find((m) => m.value === method)?.label}`}
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              await cancelPaymentInitiation(bill.id);
              router.refresh();
            })}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <Button
        disabled={isPending}
        onClick={() => startTransition(async () => {
          await initiatePayment(bill.id);
          router.refresh();
        })}
      >
        {isPending ? "Starting…" : "Start Payment"}
      </Button>
    </div>
  );
}
