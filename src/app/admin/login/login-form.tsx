"use client";

import { ActionForm, SubmitButton, TextField } from "@/components/admin/action-form";
import { signIn } from "../auth-actions";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={signIn} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField name="email" type="email" label="Email" autoComplete="username" required />
      <TextField name="password" type="password" label="Password" autoComplete="current-password" required />
      <SubmitButton className="w-full">Sign in</SubmitButton>
    </ActionForm>
  );
}
