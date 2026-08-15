"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function StaffLoginCard({
  loginUrl,
  qrDataUrl,
  restaurantCode,
}: {
  loginUrl: string;
  qrDataUrl: string;
  restaurantCode: string;
}) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  function copy(value: string, which: "link" | "code") {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt="Staff sign-in QR code" className="size-32 rounded-md border" />

      <div className="flex min-w-64 flex-1 flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Have each staff member scan this once on their phone, then &ldquo;Add to Home
          screen&rdquo;. The device remembers your restaurant — after that they only tap their
          role and PIN.
        </p>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Sign-in link</span>
          <div className="flex gap-2">
            <code className="flex-1 truncate rounded-md border bg-muted/50 px-2 py-1.5 text-xs">
              {loginUrl}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(loginUrl, "link")}>
              {copied === "link" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Restaurant code (if typing manually)
          </span>
          <div className="flex gap-2">
            <code className="flex-1 truncate rounded-md border bg-muted/50 px-2 py-1.5 text-xs">
              {restaurantCode}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copy(restaurantCode, "code")}
            >
              {copied === "code" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
