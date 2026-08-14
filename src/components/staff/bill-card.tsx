"use client";

import { useState, useTransition } from "react";

import { markBillPaid } from "@/app/actions/staff-ops";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function BillCard({ bill }: { bill: { id: string; total_amount: number; tableLabel: string } }) {
  const [method, setMethod] = useState<"cash" | "upi" | "card">("cash");
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 pt-6">
        <div>
          <p className="font-medium">Table {bill.tableLabel}</p>
          <p className="text-sm text-muted-foreground">₹{bill.total_amount}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => markBillPaid(bill.id, method))}
          >
            {isPending ? "Saving…" : "Mark paid"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
