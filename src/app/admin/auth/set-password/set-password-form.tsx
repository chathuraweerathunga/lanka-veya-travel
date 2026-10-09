"use client";
import { ActionForm, SubmitButton, TextField } from "@/components/admin/action-form";
import { setPassword } from "../../auth-actions";

export function SetPasswordForm() {
  return (
    <ActionForm action={setPassword} className="mt-6 space-y-4">
      <TextField name="fullName" label="Your name" autoComplete="name" />
      <TextField name="password" type="password" label="New password" autoComplete="new-password" minLength={12} required />
      <TextField name="confirm" type="password" label="Confirm password" autoComplete="new-password" required />
      <SubmitButton className="w-full">Save password</SubmitButton>
    </ActionForm>
  );
}
