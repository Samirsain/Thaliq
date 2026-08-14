"use client";

import { useTransition } from "react";

import { resolveWaiterRequest } from "@/app/actions/staff-ops";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const TYPE_LABEL: Record<string, string> = {
  call_waiter: "Call waiter",
  water: "Water",
  cutlery: "Cutlery",
  bill: "Bill",
  other: "Other",
};

export function WaiterRequestCard({
  request,
}: {
  request: { id: string; type: string; tableLabel: string };
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="font-medium">{TYPE_LABEL[request.type] ?? request.type}</p>
          <p className="text-xs text-muted-foreground">Table {request.tableLabel}</p>
        </div>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => resolveWaiterRequest(request.id))}
        >
          {isPending ? "Resolving…" : "Resolve"}
        </Button>
      </CardContent>
    </Card>
  );
}
