"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { useForm, type DefaultValues, type FieldValues, type Path, type PathValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import type { FormState } from "@/app/(site)/actions";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // RFC 4122 v4 fallback for older browsers
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16),
  );
}

/**
 * React Hook Form + Zod on the client for instant feedback, then the native
 * FormData is posted to a Server Action that validates again (the server is
 * the authority). Generates the idempotency key and fill-time stamp on mount.
 */
export function useActionForm<S extends z.ZodType<FieldValues, FieldValues>>(
  schema: S,
  action: (prev: FormState, fd: FormData) => Promise<FormState>,
  defaultValues: DefaultValues<z.input<S>>,
) {
  const [state, formAction, pending] = useActionState(action, { ok: false } as FormState);
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<z.input<S>, unknown, z.output<S>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    mode: "onTouched",
    // Empty defaults are omitted on purpose: React Hook Form then adopts whatever the
    // visitor already typed if they started before the page finished loading.
    defaultValues: Object.fromEntries(Object.entries(defaultValues as object).filter(([, v]) => v !== "")) as DefaultValues<z.input<S>>,
  });

  useEffect(() => {
    form.setValue("submissionKey" as Path<z.input<S>>, uuid() as PathValue<z.input<S>, Path<z.input<S>>>);
    form.setValue("startedAt" as Path<z.input<S>>, String(Date.now()) as PathValue<z.input<S>, Path<z.input<S>>>);
  }, [form]);

  // Move focus to the summary when the server reports problems.
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.message) summaryRef.current?.focus();
  }, [state]);

  const onSubmit = form.handleSubmit(
    (_data, event) => {
      const el = event?.target as HTMLFormElement | undefined;
      if (!el) return;
      const fd = new FormData(el);
      startTransition(() => formAction(fd));
    },
    (_errors, event) => {
      const el = event?.target as HTMLFormElement | undefined;
      // Wait a tick so aria-invalid attributes are rendered before focusing.
      setTimeout(() => el?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(), 0);
    },
  );

  const errorFor = (name: string): string | undefined => {
    const clientErr = (form.formState.errors as Record<string, { message?: string } | undefined>)[name]?.message;
    return clientErr ?? state.errors?.[name];
  };

  return { form, formRef, onSubmit, pending, state, errorFor, summaryRef };
}
