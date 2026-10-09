"use client";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { deleteTour } from "../actions";

export function DeleteTourButton({ id }: { id: string }) {
  return (
    <ActionForm action={deleteTour} confirmMessage="Delete this tour permanently? Archiving keeps it off the website without deleting it.">
      <input type="hidden" name="id" value={id} />
      <SubmitButton size="sm" variant="ghost">Delete</SubmitButton>
    </ActionForm>
  );
}
