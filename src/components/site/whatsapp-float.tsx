import { MessageCircle } from "lucide-react";

export function WhatsAppFloat({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-30 inline-flex size-13 items-center justify-center gap-2 rounded-full bg-[#1f7a4d] text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(11,39,38,0.55)] transition-transform hover:-translate-y-0.5 sm:bottom-5 sm:right-5 sm:h-12 sm:w-auto sm:pl-4 sm:pr-5 print:hidden"
    >
      <MessageCircle className="size-5" aria-hidden />
      <span className="sr-only sm:not-sr-only">Chat on WhatsApp</span>
    </a>
  );
}
