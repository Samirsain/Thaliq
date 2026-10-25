"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";

import { resetTable } from "@/app/actions/tables";
import { Button } from "@/components/ui/button";

export function TableSessionActions({ tableId }: { tableId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => resetTable(tableId))}
    >
      <RotateCcw className="size-3.5" />
      {isPending ? "Resetting…" : "Reset"}
    </Button>
  );
}