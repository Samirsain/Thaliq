import { cn } from "@/lib/utils";

const STEPS = [
  { status: "pending", label: "Received" },
  { status: "accepted", label: "Accepted" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
  { status: "served", label: "Served" },
];

export function OrderStatusStepper({ status }: { status: string }) {
  if (status === "cancelled") {
    return <p className="text-sm font-medium text-destructive">This order was cancelled.</p>;
  }

  const currentIndex = STEPS.findIndex((s) => s.status === status);
  const effectiveIndex = status === "completed" ? STEPS.length - 1 : currentIndex;

  return (
    <ol className="flex flex-col gap-2">
      {STEPS.map((step, i) => {
        const done = i < effectiveIndex;
        const active = i === effectiveIndex;
        return (
          <li key={step.status} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
                done && "border-brand bg-brand text-brand-foreground",
                active && !done && "border-brand text-brand",
                !done && !active && "border-muted-foreground/40 text-muted-foreground",
              )}
            >
              {done ? "✓" : active ? "●" : "○"}
            </span>
            <span className={cn("text-sm", active && "font-medium")}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
