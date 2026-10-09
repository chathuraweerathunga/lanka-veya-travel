import { Plus } from "lucide-react";
import type { Faq } from "@/lib/data/public";
import { JsonLd } from "./json-ld";

/** Native disclosure widgets: keyboard accessible without JavaScript. */
export function FaqList({ faqs, withSchema = false }: { faqs: Faq[]; withSchema?: boolean }) {
  if (!faqs.length) return null;
  return (
    <>
      <div className="divide-y divide-line border-y border-line">
        {faqs.map((f) => (
          <details key={f.id} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
              <span className="font-display text-xl text-teal-900">{f.question}</span>
              <Plus className="size-5 shrink-0 text-teal-700 transition-transform duration-300 group-open:rotate-45" aria-hidden />
            </summary>
            <p className="max-w-3xl pb-6 pr-10 text-muted">{f.answer}</p>
          </details>
        ))}
      </div>
      {withSchema ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
          }}
        />
      ) : null}
    </>
  );
}
