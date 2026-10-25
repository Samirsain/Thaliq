"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Error boundary for the /staff segment (login + cashier/kitchen/waiter).
 *
 * The most common cause of a server error here is a misconfigured staff
 * session secret, which throws inside requireStaffSession/signStaffSession.
 * Rather than surfacing the raw "A server error occurred" page, show a calm
 * message with a retry and a way back to sign-in. The actual error is logged
 * to the console for operators, never shown to the user.
 */
export default function StaffError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Staff page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            This page couldn&apos;t load. You can try again, or head back to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/staff")}>
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
