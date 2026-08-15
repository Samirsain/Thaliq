"use client";

import { useActionState, useState } from "react";
import { Lock } from "lucide-react";

import { updateBranding } from "@/app/actions/branding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Template = { id: string; slug: string; name: string; is_premium: boolean };

export function BrandingForm({
  templates,
  current,
  canUsePremium,
}: {
  templates: Template[];
  current: { template_id: string | null; primary_color: string | null; font_family: string | null } | null;
  canUsePremium: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateBranding, {
    error: null,
    success: false,
  });

  const [templateId, setTemplateId] = useState(current?.template_id ?? templates[0]?.id ?? "");
  const [color, setColor] = useState(current?.primary_color ?? "#C2410C");
  const [font, setFont] = useState(current?.font_family ?? "sans");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="fontFamily" value={font} />

      <div className="flex flex-col gap-3">
        <Label>Menu template</Label>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {templates.map((template) => {
            const locked = template.is_premium && !canUsePremium;
            return (
              <button
                key={template.id}
                type="button"
                disabled={locked}
                onClick={() => setTemplateId(template.id)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                  templateId === template.id && "border-brand ring-2 ring-brand/40",
                  locked ? "cursor-not-allowed opacity-55" : "hover:bg-accent",
                )}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  {locked ? <Lock className="size-3" /> : null}
                  {template.name}
                </span>
                <Badge variant={template.is_premium ? "brand" : "outline"}>
                  {template.is_premium ? "Premium" : "Free"}
                </Badge>
              </button>
            );
          })}
        </div>
        {!canUsePremium && (
          <p className="text-xs text-muted-foreground">
            Premium templates are available on the Business and Pro plans.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="primaryColor">Brand colour</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="size-9 cursor-pointer rounded-md border bg-transparent"
              aria-label="Pick brand colour"
            />
            <Input
              id="primaryColor"
              name="primaryColor"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-32 font-mono"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="font">Font</Label>
          <select
            id="font"
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          >
            <option value="sans">Sans (modern)</option>
            <option value="serif">Serif (classic)</option>
            <option value="mono">Mono (minimal)</option>
          </select>
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-brand">Saved — your QR menu is updated.</p> : null}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Saving…" : "Save & publish"}
      </Button>
    </form>
  );
}
