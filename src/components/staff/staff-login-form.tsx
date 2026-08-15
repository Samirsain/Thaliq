"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ChefHat, Delete, HandPlatter, Loader2, Wallet } from "lucide-react";

import { lookupRestaurant, staffLogin } from "@/app/actions/staff-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "waiter", label: "Waiter", icon: HandPlatter },
  { value: "kitchen", label: "Kitchen", icon: ChefHat },
  { value: "cashier", label: "Cashier", icon: Wallet },
];

const PIN_LENGTH = 4;
const REMEMBERED_KEY = "thaliq_staff_restaurant";

type Restaurant = { slug: string; name: string };

export function StaffLoginForm({ defaultRestaurantSlug }: { defaultRestaurantSlug?: string }) {
  const [state, formAction, isPending] = useActionState(staffLogin, { error: null });

  // Step 1 state: which restaurant this device belongs to. Once set it is
  // remembered, so day-to-day sign-in is just role + PIN — staff should never
  // have to type a restaurant code twice on the same device.
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [code, setCode] = useState(defaultRestaurantSlug ?? "");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [looking, startLookup] = useTransition();

  // Step 2 state
  const [role, setRole] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // localStorage doesn't exist during SSR, so the remembered restaurant can
    // only be read after mount — the one-time sync-from-external-system case
    // the lint rule otherwise flags.
    const stored = window.localStorage.getItem(REMEMBERED_KEY);
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRestaurant(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem(REMEMBERED_KEY);
      }
    }
    setHydrated(true);
  }, []);

  // A ?r=<slug> link (the QR the owner prints for staff) resolves itself.
  useEffect(() => {
    if (!hydrated || restaurant || !defaultRestaurantSlug) return;
    startLookup(async () => {
      const result = await lookupRestaurant(defaultRestaurantSlug);
      if (!("error" in result)) {
        window.localStorage.setItem(REMEMBERED_KEY, JSON.stringify(result));
        setRestaurant(result);
      }
    });
  }, [hydrated, restaurant, defaultRestaurantSlug]);

  // Submit as soon as the 4th digit lands — no extra button press mid-service.
  useEffect(() => {
    if (pin.length === PIN_LENGTH && role) formRef.current?.requestSubmit();
  }, [pin, role]);

  // Wrong PIN: clear the pad so the next attempt starts clean.
  const [lastError, setLastError] = useState(state.error);
  if (state.error !== lastError) {
    setLastError(state.error);
    if (state.error) setPin("");
  }

  function handleLookup() {
    setLookupError(null);
    startLookup(async () => {
      const result = await lookupRestaurant(code);
      if ("error" in result) {
        setLookupError(result.error);
        return;
      }
      window.localStorage.setItem(REMEMBERED_KEY, JSON.stringify(result));
      setRestaurant(result);
    });
  }

  function forgetRestaurant() {
    window.localStorage.removeItem(REMEMBERED_KEY);
    setRestaurant(null);
    setRole(null);
    setPin("");
    setCode("");
  }

  if (!hydrated) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // ---- Step 1: identify the restaurant (first run on this device only) ----
  if (!restaurant) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set up this device</CardTitle>
          <CardDescription>
            Enter your restaurant code once — this device will remember it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Restaurant code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="the-coffee-house-a3f9c1"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              Your manager can find this on the Staff page of the THALIQ dashboard.
            </p>
          </div>

          {lookupError ? <p className="text-sm text-destructive">{lookupError}</p> : null}

          <Button onClick={handleLookup} disabled={looking || !code.trim()}>
            {looking ? "Checking…" : "Continue"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---- Step 2: role + PIN (the everyday path) ----
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{restaurant.name}</CardTitle>
        <CardDescription>Choose your role and enter your PIN.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="restaurantSlug" value={restaurant.slug} />
          <input type="hidden" name="role" value={role ?? ""} />
          <input type="hidden" name="pin" value={pin} />

          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setRole(value);
                  setPin("");
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-sm font-medium transition-colors",
                  role === value
                    ? "border-brand bg-brand text-brand-foreground"
                    : "hover:bg-accent",
                )}
              >
                <Icon className="size-5" />
                {label}
              </button>
            ))}
          </div>

          {role ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-3">
                {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "size-3.5 rounded-full border transition-colors",
                      i < pin.length ? "border-brand bg-brand" : "border-muted-foreground/40",
                    )}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <Button
                    key={digit}
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    className="size-14 text-lg"
                    onClick={() => setPin((p) => (p.length < PIN_LENGTH ? p + digit : p))}
                  >
                    {digit}
                  </Button>
                ))}
                <span />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className="size-14 text-lg"
                  onClick={() => setPin((p) => (p.length < PIN_LENGTH ? p + "0" : p))}
                >
                  0
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className="size-14"
                  onClick={() => setPin((p) => p.slice(0, -1))}
                  aria-label="Delete last digit"
                >
                  <Delete className="size-5" />
                </Button>
              </div>

              {isPending ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Tap your role above to continue.
            </p>
          )}

          {state.error ? (
            <p className="text-center text-sm text-destructive">{state.error}</p>
          ) : null}

          <button
            type="button"
            onClick={forgetRestaurant}
            className="text-center text-xs text-muted-foreground underline underline-offset-4"
          >
            Not {restaurant.name}?
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
