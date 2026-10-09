import Link from "next/link";
import { Wordmark } from "@/components/site/wordmark";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ivory px-6 text-center">
      <Link href="/" aria-label="Lanka Veya Travel home"><Wordmark /></Link>
      <h1 className="text-5xl text-teal-900">This page took a different road</h1>
      <p className="max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex h-11 items-center rounded-md bg-teal-900 px-5 text-white">Go to the homepage</Link>
        <Link href="/tours" className="inline-flex h-11 items-center rounded-md border border-line px-5 text-teal-900">Browse tours</Link>
      </div>
    </main>
  );
}
