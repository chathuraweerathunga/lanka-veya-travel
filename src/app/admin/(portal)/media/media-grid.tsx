"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ImageUp, Loader2, Trash2 } from "lucide-react";
import { uploadImageAction } from "@/app/admin/(portal)/upload-action";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import type { MediaFile } from "@/lib/admin/media-library";
import { deleteMedia } from "./actions";

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function MediaUploader() {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);
  const upload = (files: FileList) => {
    setNote(null);
    start(async () => {
      let ok = 0;
      const failed: string[] = [];
      for (const file of Array.from(files).slice(0, 20)) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("folder", "site");
        const r = await uploadImageAction(fd);
        if (r.ok) ok++;
        else failed.push(`${file.name}: ${r.message}`);
      }
      setNote([ok ? `${ok} photo${ok === 1 ? "" : "s"} uploaded.` : "", ...failed].filter(Boolean).join(" "));
      if (ref.current) ref.current.value = "";
      router.refresh();
    });
  };
  return (
    <div className="space-y-2">
      <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-teal-900 px-5 text-[0.95rem] font-medium text-white hover:bg-teal-800">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImageUp className="size-4" aria-hidden />}
        {pending ? "Uploading…" : "Upload photos"}
        <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={pending} onChange={(e) => e.target.files?.length && upload(e.target.files)} />
      </label>
      <p className="text-xs text-muted">Select up to 20 at once. JPEG, PNG, WebP or AVIF, up to 5 MB each.</p>
      {note ? <p className="text-sm text-teal-900" role="status">{note}</p> : null}
    </div>
  );
}

export function MediaGrid({ files, canDelete }: { files: MediaFile[]; canDelete: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 1800);
    } catch {}
  };
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {files.map((f) => (
        <li key={f.path} className="group overflow-hidden rounded-lg border border-line bg-white">
          <div className="relative aspect-[4/3] overflow-hidden bg-ivory">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[0.7rem] font-medium capitalize text-teal-900">{f.folder}</span>
          </div>
          <div className="flex items-center justify-between gap-2 p-2.5 text-xs text-muted">
            <span>{kb(f.size)}{f.createdAt ? ` · ${new Date(f.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}</span>
            <span className="flex items-center gap-1">
              <button type="button" onClick={() => copy(f.url)} className="inline-flex size-8 items-center justify-center rounded-md hover:bg-teal-50 hover:text-teal-900" aria-label="Copy photo link" title="Copy photo link">
                {copied === f.url ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              </button>
              {canDelete ? (
                <ActionForm action={deleteMedia} confirmMessage="Delete this photo permanently? Any page still using it will show an empty space.">
                  <input type="hidden" name="path" value={f.path} />
                  <SubmitButton size="icon" variant="ghost" className="size-8 text-danger hover:bg-red-50">
                    <Trash2 className="size-4" aria-hidden />
                    <span className="sr-only">Delete photo</span>
                  </SubmitButton>
                </ActionForm>
              ) : null}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
