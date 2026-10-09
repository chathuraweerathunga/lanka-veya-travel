"use client";

import type { ReactNode, RefObject } from "react";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FormSummary({ message, summaryRef }: { message?: string; summaryRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={summaryRef} tabIndex={-1} className="outline-none" aria-live="assertive">
      {message ? <Alert tone="error">{message}</Alert> : null}
    </div>
  );
}

/** Honeypot: hidden from people and assistive tech, attractive to bots. */
export function Honeypot({ register }: { register: () => object }) {
  return (
    <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" tabIndex={-1} autoComplete="off" {...register()} />
      </label>
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" disabled={pending} aria-disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {pending ? "Sending…" : children}
    </Button>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-6 border-t border-line pt-8 md:grid-cols-[14rem_1fr] md:gap-10">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden className="space-y-1">
        <p className="font-display text-xl text-teal-900">{title}</p>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export const PRIVACY_NOTE =
  "We use your details only to reply to this request and prepare your quotation.";
