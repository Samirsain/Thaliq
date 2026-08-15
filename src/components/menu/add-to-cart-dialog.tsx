"use client";

import { useState } from "react";

import { useCart } from "@/components/menu/cart-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Variant = { id: string; name: string; price: number; is_default: boolean };
type Addon = { id: string; name: string; price: number };

export type MenuItemForCart = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  is_veg: boolean;
  is_bestseller: boolean;
  is_available: boolean;
  menu_variants: Variant[];
  menu_addons: Addon[];
};

export function AddToCartDialog({
  item,
  open,
  onOpenChange,
}: {
  item: MenuItemForCart;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addLine } = useCart();
  const defaultVariant = item.menu_variants.find((v) => v.is_default) ?? item.menu_variants[0];
  const [variantId, setVariantId] = useState<string | null>(defaultVariant?.id ?? null);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");

  const activeVariant = item.menu_variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = activeVariant ? activeVariant.price : item.base_price;
  const selectedAddons = item.menu_addons.filter((a) => addonIds.includes(a.id));
  const total = (unitPrice + selectedAddons.reduce((s, a) => s + a.price, 0)) * quantity;

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  function handleAdd() {
    addLine({
      itemId: item.id,
      itemName: item.name,
      isVeg: item.is_veg,
      variantId: activeVariant?.id ?? null,
      variantName: activeVariant?.name ?? null,
      unitPrice,
      addons: selectedAddons,
      quantity,
      specialInstructions: instructions.trim(),
    });
    onOpenChange(false);
    setQuantity(1);
    setAddonIds([]);
    setInstructions("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {item.image_url ? (
          // A plain block with its own rounding — an earlier negative-margin
          // bleed pushed the image past the dialog's rounded corners and its
          // overflow-y-auto clip, which read as the photo being cut off.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            className="aspect-[4/3] w-full rounded-lg border object-cover"
          />
        ) : null}

        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}

        {item.menu_variants.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>Size / variant</Label>
            <div className="flex flex-wrap gap-2">
              {item.menu_variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm",
                    variantId === variant.id ? "border-brand bg-brand text-brand-foreground" : "hover:bg-accent",
                  )}
                >
                  {variant.name} · ₹{variant.price}
                </button>
              ))}
            </div>
          </div>
        )}

        {item.menu_addons.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>Add-ons</Label>
            <div className="flex flex-col gap-1.5">
              {item.menu_addons.map((addon) => (
                <label key={addon.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={addonIds.includes(addon.id)}
                    onChange={() => toggleAddon(addon.id)}
                  />
                  {addon.name} (+₹{addon.price})
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="instructions">Special instructions</Label>
          <Input
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Less spicy, no onions…"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Quantity</Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </Button>
            <span className="w-6 text-center">{quantity}</span>
            <Button type="button" variant="outline" size="icon" onClick={() => setQuantity((q) => q + 1)}>
              +
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAdd} className="w-full">
            Add to cart · ₹{total}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
