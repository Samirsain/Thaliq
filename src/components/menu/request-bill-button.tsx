"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { requestWaiterAssistance } from "@/app/actions/waiter-requests";
import { Button } from "@/components/ui/button";

export function RequestBillButton({
  branchId,
  tableId,
  className,
}: {
  branchId: string;
  tableId: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRequestBill() {
    startTransition(async () => {
      await requestWaiterAssistance(branchId, tableId, "bill");
      router.refresh();
    });
  }

  return (
    <Button onClick={handleRequestBill} disabled={isPending} className={className}>
      {isPending ? "Requesting…" : "Pay / Request Bill"}
    </Button>
  );
}
