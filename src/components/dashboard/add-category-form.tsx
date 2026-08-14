"use client";

import { useActionState } from "react";

import { addMenuCategory } from "@/app/actions/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddCategoryForm() {
  const [state, formAction, isPending] = useActionState(addMenuCategory, { error: null });

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoryName">Category name</Label>
        <Input id="categoryName" name="name" placeholder="Coffee" required className="w-48" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add category"}
      </Button>
      {state.error ? <p className="w-full text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
