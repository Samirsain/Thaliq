"use client";

import { useActionState, useState } from "react";

import { addMenuItem } from "@/app/actions/menu";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddItemForm({
  categories,
  restaurantId,
}: {
  categories: { id: string; name: string }[];
  restaurantId: string;
}) {
  const [state, formAction, isPending] = useActionState(addMenuItem, { error: null });
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Clear the picked image once the item has been saved, so the next item
  // doesn't silently reuse the previous photo. Adjusting state during render
  // (rather than in an effect) is React's recommended way to react to a
  // changed prop/action result — it re-renders before committing, with no
  // extra paint.
  const [lastSavedAt, setLastSavedAt] = useState(state.savedAt);
  if (state.savedAt !== lastSavedAt) {
    setLastSavedAt(state.savedAt);
    setImageUrl(null);
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="imageUrl" value={imageUrl ?? ""} />
      <div className="flex w-full flex-col gap-1.5">
        <Label>Photo</Label>
        <ImageUpload
          bucket="menu-images"
          restaurantId={restaurantId}
          value={imageUrl}
          onChange={setImageUrl}
          prefix="item"
          label="Add photo"
        />
      </div>
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
