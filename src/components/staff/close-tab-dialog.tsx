"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { closeTableSession } from "@/app/actions/staff-ops";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CloseTabDialog({
  sessionId,
  tableLabel,
  runningTotal,
}: {
  sessionId: string;
  tableLabel: string;
  runningTotal: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClose(resolution: "external" | "unpaid") {
    startTransition(async () => {
      await closeTableSession(sessionId, resolution);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">Close Tab</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Table {tableLabel}?</DialogTitle>
          <DialogDescription>
            Current total: ₹{runningTotal}. Closing this tab will end the current customer session and make this table available again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <p className="text-sm font-medium">How was this tab resolved?</p>
          <Button disabled={isPending} onClick={() => handleClose("external")}>
            {isPending ? "Closing…" : "Payment Handled Externally"}
          </Button>
          <Button variant="outline" disabled={isPending} onClick={() => handleClose("unpaid")}>
            Clear Without Payment
          </Button>
          <Button variant="ghost" disabled={isPending} onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
