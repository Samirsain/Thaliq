"use client";

import { useState } from "react";

import { useCart } from "@/components/menu/cart-provider";
import { CartSheet } from "@/components/menu/cart-sheet";
import { Button } from "@/components/ui/button";

export function CartBar() {
  const { itemCount, subtotal } = useCart();
  const [open, setOpen] = useState(false);

  if (itemCount === 0) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl p-4">
        <Button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between px-4 py-6 text-base shadow-lg"
        >
          <span>
            {itemCount} item{itemCount > 1 ? "s" : ""}
          </span>
          <span>View cart · ₹{subtotal}</span>
        </Button>
      </div>
      <CartSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
