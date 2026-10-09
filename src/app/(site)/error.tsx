"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry?: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-start justify-center gap-5 py-20">
      <h1 className="text-4xl text-teal-900">Something went wrong loading this page</h1>
      <p className="max-w-lg text-muted">Please try again. If it keeps happening, you can still reach us on WhatsApp or by email.</p>
      <div className="flex gap-3">
        <button type="button" onClick={() => (unstable_retry ? unstable_retry() : window.location.reload())} className="inline-flex h-11 items-center rounded-md bg-teal-900 px-5 text-white">
          Try again
        </button>
        <Link href="/" className="inline-flex h-11 items-center rounded-md border border-line px-5 text-teal-900">Homepage</Link>
      </div>
      {error.digest ? <p className="text-xs text-muted">Error reference: {error.digest}</p> : null}
    </div>
  );
}
