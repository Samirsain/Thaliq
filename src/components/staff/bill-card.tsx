"use client";

import { useState, useTransition } from "react";
import { QrCode, Wallet } from "lucide-react";

import { markBillPaid } from "@/app/actions/staff-ops";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Bill = {
  id: string;
  total_amount: number;
  tableLabel: string;
  /** Pre-rendered UPI QR, null when the restaurant hasn't set a UPI ID. */
  upiQrDataUrl: string | null;
};

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
] as const;

export function BillCard({ bill }: { bill: Bill }) {
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("cash");
  const [showQr, setShowQr] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-baseline justify-between">
            <p className="font-medium">Table {bill.tableLabel}</p>
            <p className="text-xl font-semibold">₹{bill.total_amount}</p>
          </div>

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

          {method === "upi" ? (
            bill.upiQrDataUrl ? (
              <Button type="button" variant="outline" onClick={() => setShowQr(true)}>
                <QrCode className="size-4" />
                Show QR to customer
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                No UPI ID set. The owner can add one in Settings to show a payment QR here.
              </p>
            )
          ) : null}

          <Button
            disabled={isPending}
            onClick={() => startTransition(() => markBillPaid(bill.id, method))}
          >
            <Wallet className="size-4" />
            {isPending ? "Saving…" : `Mark paid · ${METHODS.find((m) => m.value === method)?.label}`}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Table {bill.tableLabel} · ₹{bill.total_amount}</DialogTitle>
          </DialogHeader>
          {bill.upiQrDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bill.upiQrDataUrl} alt="UPI payment QR" className="w-full rounded-md border" />
              <p className="text-center text-xs text-muted-foreground">
                Customer scans with any UPI app. Confirm the payment landed, then tap Mark paid.
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
