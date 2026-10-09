"use client";

import { useRef, useState, useTransition } from "react";
import { ImageUp, Loader2, X } from "lucide-react";
import { uploadImageAction } from "@/app/admin/(portal)/upload-action";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

/**
 * Upload an image to the media bucket, or paste a licensed image URL.
 * Writes the final URL into a hidden input (or onChange for RHF forms).
 */
export function ImageField({
  name, label, folder, defaultValue, onChange,
}: { name?: string; label: string; folder: "tours" | "destinations" | "vehicles" | "site"; defaultValue?: string | null; onChange?: (url: string) => void }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const id = `img-${name ?? label.replace(/\W+/g, "-").toLowerCase()}`;
  const set = (v: string) => {
    setUrl(v);
    onChange?.(v);
  };

  const upload = (file: File) => {
    setError(null);
    if (file.size > 5 * 1024 * 1024) return setError("Images must be 5 MB or smaller.");
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);
    start(async () => {
      const r = await uploadImageAction(fd);
      if (r.ok) set(r.url);
      else setError(r.message);
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {name ? <input type="hidden" name={name} value={url} /> : null}
      <div className="flex gap-4">
        <div className="relative flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-ivory">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageUp className="size-6 text-muted" aria-hidden />
          )}
          {pending ? <span className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="size-5 animate-spin" aria-hidden /></span> : null}
        </div>
        <div className="flex-1 space-y-2">
          <Input id={id} value={url} onChange={(e) => set(e.target.value)} placeholder="https://… or upload a file" inputMode="url" />
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-line px-3 text-sm hover:border-teal-700">
              <ImageUp className="size-4" aria-hidden /> Upload image
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {url ? <Button type="button" size="sm" variant="ghost" onClick={() => set("")}><X aria-hidden /> Remove</Button> : null}
            <span className="text-xs text-muted">JPEG, PNG, WebP or AVIF, up to 5 MB. Only use photos you have the right to publish.</span>
          </div>
          {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
