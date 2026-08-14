"use client";

import { useActionState } from "react";

import { createRestaurant } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateRestaurantForm() {
  const [state, formAction, isPending] = useActionState(createRestaurant, { error: null });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set up your restaurant</CardTitle>
        <CardDescription>
          We&apos;ll create your first branch too — you can add tables and menu items next.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Restaurant name</Label>
            <Input id="name" name="name" placeholder="The Coffee House" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branchName">First branch name</Label>
            <Input id="branchName" name="branchName" placeholder="Main Branch" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cuisineType">Cuisine type</Label>
            <Input id="cuisineType" name="cuisineType" placeholder="Cafe, Bakery, Fast Food…" />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating…" : "Create restaurant"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
