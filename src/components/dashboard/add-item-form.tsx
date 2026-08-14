"use client";

import { useActionState } from "react";

import { addMenuItem } from "@/app/actions/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddItemForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(addMenuItem, { error: null });

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          name="categoryId"
          required
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="itemName">Item name</Label>
        <Input id="itemName" name="name" placeholder="Cappuccino" required className="w-48" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="basePrice">Price (₹)</Label>
        <Input
          id="basePrice"
          name="basePrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="149"
          required
          className="w-28"
        />
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input type="checkbox" name="isVeg" defaultChecked className="size-4" />
        Veg
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add item"}
      </Button>
      {state.error ? <p className="w-full text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
