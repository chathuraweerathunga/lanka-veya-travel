"use client";
import { ActionForm, SubmitButton, TextField } from "@/components/admin/action-form";
import { requestPasswordReset } from "../../auth-actions";

export function ForgotForm() {
  return (
    <ActionForm action={requestPasswordReset} className="mt-6 space-y-4">
      <TextField name="email" type="email" label="Email" autoComplete="username" required />
      <SubmitButton className="w-full">Send reset link</SubmitButton>
    </ActionForm>
  );
}
