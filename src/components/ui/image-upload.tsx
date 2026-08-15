"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/compress-image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  /** Storage bucket: "menu-images" or "restaurant-branding". */
  bucket: string;
  /** Owning restaurant — becomes the first path segment, which storage RLS checks. */
  restaurantId: string;
  /** Current image URL, if any. */
  value: string | null;
  onChange: (url: string | null) => void;
  /** Filename prefix, e.g. "logo" or "cover". */
  prefix?: string;
  className?: string;
  label?: string;
};

export function ImageUpload({
  bucket,
  restaurantId,
  value,
  onChange,
  prefix = "img",
  className,
  label = "Upload image",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      const extension = compressed.type === "image/webp" ? "webp" : "jpg";
      const path = `${restaurantId}/${prefix}-${crypto.randomUUID()}.${extension}`;

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, compressed, { contentType: compressed.type, upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      onChange(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {value ? (
        <div className="relative w-fit">
          {/* Supabase Storage serves these already-compressed images directly;
              next/image optimization would add cost for no real benefit here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-24 rounded-md border object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 rounded-full border bg-background p-1 shadow-sm"
            aria-label="Remove image"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="w-fit"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {busy ? "Uploading…" : label}
        </Button>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
