"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { ActionResult } from "@/lib/admin/action";
import { cn } from "@/lib/utils";

type Action = (prev: ActionResult | undefined, fd: FormData) => Promise<ActionResult>;
const ErrorsContext = createContext<Partial<Record<string, string>> | undefined>(undefined);
const PendingContext = createContext(false);

/** Progressive-enhancement form for admin Server Actions with inline result + field errors. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  successMessage,
  onSuccess,
  confirmMessage,
  ...rest
}: { action: Action; children: ReactNode; className?: string; resetOnSuccess?: boolean; successMessage?: string; onSuccess?: () => void; confirmMessage?: string } & Omit<ComponentProps<"form">, "action" | "onSubmit">) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  // Submitting via onSubmit (not the `action` prop) keeps what the user typed when
  // the server reports an error; React would otherwise reset the form.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };
  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
  }, [state, resetOnSuccess, onSuccess]);
  return (
    <ErrorsContext.Provider value={state?.errors}>
      <PendingContext.Provider value={pending}>
      <form ref={ref} onSubmit={onSubmit} className={className} {...rest}>
        {children}
        {state?.message ? (
          <Alert tone={state.ok ? "success" : "error"} className="mt-4">
            {state.ok && successMessage ? successMessage : state.message}
          </Alert>
        ) : null}
      </form>
      </PendingContext.Provider>
    </ErrorsContext.Provider>
  );
}

export function useFieldError(name: string) {
  return useContext(ErrorsContext)?.[name];
}

export function SubmitButton({ children, variant, size = "md", className }: { children: ReactNode; variant?: ComponentProps<typeof Button>["variant"]; size?: ComponentProps<typeof Button>["size"]; className?: string }) {
  const pending = useContext(PendingContext);
  return (
    <Button type="submit" disabled={pending} variant={variant} size={size} className={className}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}

type Common = { name: string; label: ReactNode; hint?: ReactNode; required?: boolean; className?: string };

export function TextField({ name, label, hint, required, className, ...props }: Common & Omit<ComponentProps<"input">, "name">) {
  const error = useFieldError(name);
  const id = props.id ?? `f-${name}`;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <Input id={id} name={name} required={required} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} />
    </Field>
  );
}

export function TextAreaField({ name, label, hint, required, className, ...props }: Common & Omit<ComponentProps<"textarea">, "name">) {
  const error = useFieldError(name);
  const id = props.id ?? `f-${name}`;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <Textarea id={id} name={name} required={required} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} />
    </Field>
  );
}

export function SelectField({ name, label, hint, required, className, options, ...props }: Common & Omit<ComponentProps<"select">, "name"> & { options: { value: string; label: string }[] }) {
  const error = useFieldError(name);
  const id = props.id ?? `f-${name}`;
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <Select id={id} name={name} required={required} aria-invalid={error ? true : undefined} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function CheckboxField({ name, label, hint, defaultChecked, className }: { name: string; label: ReactNode; hint?: ReactNode; defaultChecked?: boolean; className?: string }) {
  return (
    <label className={cn("flex items-start gap-3 text-sm", className)}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-teal-900" />
      <span>
        <span className="font-medium">{label}</span>
        {hint ? <span className="block text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}
