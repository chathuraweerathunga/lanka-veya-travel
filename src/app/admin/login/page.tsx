import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/site/wordmark";
import { LoginForm } from "./login-form";
import { isSupabaseConfigured } from "@/lib/env";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const reason = typeof sp.reason === "string" ? sp.reason : undefined;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ivory px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex justify-center"><Wordmark /></Link>
        <div className="rounded-md border border-line bg-white p-7">
          <h1 className="font-display text-2xl text-teal-900">Owner portal</h1>
          <p className="mt-1 text-sm text-muted">Sign in with your team account.</p>
          {!isSupabaseConfigured() ? (
            <Alert tone="warning" className="mt-5">Supabase isn&apos;t configured for this deployment yet. See the README.</Alert>
          ) : null}
          {reason === "link-expired" ? <Alert tone="warning" className="mt-5">That link has expired or was already used. Ask for a new invitation or reset link.</Alert> : null}
          {reason === "unauthorized" ? <Alert tone="info" className="mt-5">Sign in to continue. Accounts must be activated by the owner.</Alert> : null}
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/admin/auth/forgot" className="underline underline-offset-4">Forgot your password?</Link>
        </p>
      </div>
    </main>
  );
}
