import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { FaqList } from "@/components/site/faq-list";
import { JsonLd } from "@/components/site/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { getFaqs } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Questions & answers",
  description: "How booking works, airport transfers, quotations, payment and cancellations with Lanka Veya Travel.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getFaqs();
  const groups = [...new Set(faqs.map((f) => f.category ?? "General"))];
  return (
    <>
      <PageIntro title="Questions & answers" lede="If your question isn't here, ask us on WhatsApp or by email." crumbs={[{ href: "/faq", label: "FAQ" }]} />
      <div className="container-page space-y-14 py-14 md:py-20">
        {faqs.length ? (
          groups.map((g) => (
            <section key={g} className="grid gap-8 lg:grid-cols-[14rem_1fr]">
              <h2 className="text-2xl text-teal-900">{g}</h2>
              <FaqList faqs={faqs.filter((f) => (f.category ?? "General") === g)} />
            </section>
          ))
        ) : (
          <p className="text-muted">Questions will appear here soon.</p>
        )}
        {faqs.length ? (
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
            }}
          />
        ) : null}
        <ButtonLink href="/contact" variant="outline">Ask a question</ButtonLink>
      </div>
    </>
  );
}
