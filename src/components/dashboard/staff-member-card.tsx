"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  editStaffName,
  resetStaffPin,
  revokeStaffSessions,
  toggleStaffActive,
} from "@/app/actions/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StaffMember = {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  branchName: string | null;
};

export function StaffMemberCard({ member }: { member: StaffMember }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [editName, setEditName] = useState(member.name);
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleEditName() {
    setError(null);
    startTransition(async () => {
      const result = await editStaffName(member.id, editName);
      if (result.error) {
        setError(result.error);
      } else {
        setEditOpen(false);
        router.refresh();
      }
    });
  }

  function handleResetPin() {
    setError(null);
    startTransition(async () => {
      const result = await resetStaffPin(member.id, newPin);
      if (result.error) {
        setError(result.error);
      } else {
        setPinOpen(false);
        setNewPin("");
        router.refresh();
      }
    });
  }

  function handleToggleActive() {
    startTransition(async () => {
      await toggleStaffActive(member.id, !member.is_active);
      router.refresh();
    });
  }

  function handleRevokeSessions() {
    startTransition(async () => {
      await revokeStaffSessions(member.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between border-b py-3 last:border-0">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <p className="font-medium">{member.name}</p>
          <Badge variant="outline" className="capitalize">
            {member.role}
          </Badge>
          {!member.is_active && <Badge variant="destructive">Inactive</Badge>}
        </div>
        {member.branchName && (
          <p className="text-xs text-muted-foreground">{member.branchName}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit name</DialogTitle>
              <DialogDescription>Update the display name for this staff member.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleEditName} disabled={isPending || !editName.trim()}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={pinOpen} onOpenChange={setPinOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              Reset PIN
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset PIN</DialogTitle>
              <DialogDescription>
                This will invalidate all active sessions for {member.name}. They will need to sign in again with the new PIN.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-2">
              <Label htmlFor="newPin">New 4-digit PIN</Label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4 digits"
                className="w-32"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPinOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleResetPin} disabled={isPending || !/^\d{4}$/.test(newPin)}>
                {isPending ? "Saving…" : "Reset PIN"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {member.is_active && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={handleRevokeSessions}
          >
            Revoke Sessions
          </Button>
        )}

        <Button
          type="button"
          variant={member.is_active ? "outline" : "default"}
          size="sm"
          disabled={isPending}
          onClick={handleToggleActive}
        >
          {member.is_active ? "Deactivate" : "Activate"}
        </Button>
      </div>
    </div>
  );
}
