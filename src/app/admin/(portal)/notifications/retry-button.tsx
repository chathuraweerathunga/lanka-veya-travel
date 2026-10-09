"use client";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { retryDelivery } from "./actions";

export function RetryButton({ id }: { id: string }) {
  return (
    <ActionForm action={retryDelivery}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton size="sm" variant="outline">Retry</SubmitButton>
    </ActionForm>
  );
}
