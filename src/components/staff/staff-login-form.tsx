"use client";

import { useActionState, useState } from "react";
import { Delete } from "lucide-react";

import { staffLogin } from "@/app/actions/staff-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "waiter", label: "Waiter" },
  { value: "kitchen", label: "Kitchen" },
  { value: "cashier", label: "Cashier" },
];

const PIN_LENGTH = 4;

export function StaffLoginForm({ defaultRestaurantSlug }: { defaultRestaurantSlug?: string }) {
  const [state, formAction, isPending] = useActionState(staffLogin, { error: null });
  const [role, setRole] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Staff sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="restaurantSlug">Restaurant</Label>
            <Input
              id="restaurantSlug"
              name="restaurantSlug"
              placeholder="the-coffee-house"
              defaultValue={defaultRestaurantSlug}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Select role</Label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    role === r.value
                      ? "border-brand bg-brand text-brand-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="role" value={role ?? ""} />
          </div>

          <div className="flex flex-col items-center gap-3">
            <Label>Enter PIN</Label>
            <div className="flex gap-3">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-3 rounded-full border",
                    i < pin.length ? "border-brand bg-brand" : "border-muted-foreground/40",
                  )}
                />
              ))}
            </div>
            <input type="hidden" name="pin" value={pin} />
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <Button
                  key={digit}
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-12 text-base"
                  onClick={() => pin.length < PIN_LENGTH && setPin(pin + digit)}
                >
                  {digit}
                </Button>
              ))}
              <span />
              <Button
                key="0"
                type="button"
                variant="outline"
                size="icon"
                className="size-12 text-base"
                onClick={() => pin.length < PIN_LENGTH && setPin(pin + "0")}
              >
                0
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-12"
                onClick={() => setPin(pin.slice(0, -1))}
              >
                <Delete className="size-4" />
              </Button>
            </div>
          </div>

          {state.error ? <p className="text-center text-sm text-destructive">{state.error}</p> : null}

          <Button type="submit" disabled={isPending || !role || pin.length !== PIN_LENGTH}>
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
