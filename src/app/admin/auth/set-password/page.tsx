import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: "Set your password" };

export default async function SetPasswordPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login?reason=link-expired");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-sm rounded-md border border-line bg-white p-7">
        <h1 className="font-display text-2xl text-teal-900">Set your password</h1>
        <p className="mt-1 text-sm text-muted">For {data.user.email}. Use at least 12 characters.</p>
        <SetPasswordForm />
      </div>
    </main>
  );
}
