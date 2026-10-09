"use client";
import { ActionForm, CheckboxField, SelectField, SubmitButton, TextField } from "@/components/admin/action-form";
import { inviteTeamMember, updateTeamMember } from "./actions";

export function InviteForm() {
  return (
    <ActionForm action={inviteTeamMember} resetOnSuccess className="grid items-end gap-3 md:grid-cols-[2fr_2fr_1fr_auto]">
      <TextField name="email" type="email" label="Email" required />
      <TextField name="fullName" label="Name" />
      <SelectField name="role" label="Role" options={[{ value: "staff", label: "Staff" }, { value: "admin", label: "Admin" }]} />
      <SubmitButton>Send invitation</SubmitButton>
    </ActionForm>
  );
}

export function MemberForm({ id, role, isActive }: { id: string; role: string; isActive: boolean }) {
  return (
    <ActionForm action={updateTeamMember} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={id} />
      <SelectField name="role" label="Role" defaultValue={role} options={[{ value: "staff", label: "Staff" }, { value: "admin", label: "Admin" }, { value: "owner", label: "Owner" }]} className="w-36" />
      <CheckboxField name="isActive" label="Can sign in" defaultChecked={isActive} className="pb-3" />
      <SubmitButton size="sm" variant="outline">Update</SubmitButton>
    </ActionForm>
  );
}
