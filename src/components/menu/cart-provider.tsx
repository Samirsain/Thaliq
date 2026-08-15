"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { type CartLine, lineTotal } from "@/lib/cart-types";

type CartContextValue = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(restaurant: string, branch: string, table?: string) {
  return `thaliq_cart:${restaurant}:${branch}:${table ?? "general"}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ restaurant: string; branch: string; table?: string }>();
  const key = storageKey(params.restaurant, params.branch, params.table);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage isn't available during SSR, so the cart starts empty on
    // the server and hydrates from the browser's copy right after mount -
    // this is the one-time sync-with-an-external-system case the lint rule
    // otherwise warns about.
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLines(raw ? JSON.parse(raw) : []);
    } catch {
      setLines([]);
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(key, JSON.stringify(lines));
  }, [key, lines, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addLine: CartContextValue["addLine"] = (line) => {
      setLines((prev) => [...prev, { ...line, key: crypto.randomUUID() }]);
    };

    const updateQuantity: CartContextValue["updateQuantity"] = (lineKey, quantity) => {
      setLines((prev) =>
        quantity <= 0
          ? prev.filter((l) => l.key !== lineKey)
          : prev.map((l) => (l.key === lineKey ? { ...l, quantity } : l)),
      );
    };

    const removeLine: CartContextValue["removeLine"] = (lineKey) => {
      setLines((prev) => prev.filter((l) => l.key !== lineKey));
    };

    const clear = () => setLines([]);

    return {
      lines,
      addLine,
      updateQuantity,
      removeLine,
      clear,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + lineTotal(l), 0),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
