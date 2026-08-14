"use client";

import { useActionState } from "react";

import { addStaff } from "@/app/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddStaffForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(addStaff, { error: null });

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="staffName">Name</Label>
        <Input id="staffName" name="name" placeholder="Priya" required className="w-40" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          required
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
        >
          <option value="manager">Manager</option>
          <option value="waiter">Waiter</option>
          <option value="kitchen">Kitchen</option>
          <option value="cashier">Cashier</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="branchId">Branch</Label>
        <select
          id="branchId"
          name="branchId"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pin">PIN</Label>
        <Input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          placeholder="4–6 digits"
          minLength={4}
          maxLength={6}
          required
          className="w-32"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add staff"}
      </Button>
      {state.error ? <p className="w-full text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}
