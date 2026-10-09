import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-sm rounded-md border border-line bg-white p-7">
        <h1 className="font-display text-2xl text-teal-900">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">We&apos;ll email a link to set a new password.</p>
        <ForgotForm />
        <p className="mt-6 text-sm"><Link href="/admin/login" className="text-teal-700 underline underline-offset-4">Back to sign in</Link></p>
      </div>
    </main>
  );
}
