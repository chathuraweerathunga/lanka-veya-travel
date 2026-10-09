/**
 * WhatsApp click-to-chat links (https://wa.me/<number>?text=…).
 * Messages contain only what the visitor/owner would type themselves: no
 * internal notes, no emails, no secrets.
 */
export function whatsappNumberDigits(number: string | null | undefined): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function whatsappLink(number: string | null | undefined, message?: string): string | null {
  const digits = whatsappNumberDigits(number);
  if (!digits) return null;
  const text = message?.trim();
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text.slice(0, 1500))}` : `https://wa.me/${digits}`;
}

export const whatsappMessages = {
  general: () => "Hello Lanka Veya Travel, I'd like help planning a trip in Sri Lanka.",
  tour: (tourName: string) => `Hello Lanka Veya Travel, I'm interested in the "${tourName}" tour. Could you help me with a quotation?`,
  destination: (name: string) => `Hello Lanka Veya Travel, I'd like to include ${name} in my Sri Lanka trip.`,
  transport: (service: string) => `Hello Lanka Veya Travel, I'd like a quotation for: ${service}.`,
  reference: (reference: string) => `Hello Lanka Veya Travel, I submitted request ${reference} and have a question.`,
  /** Owner -> customer follow-ups (opened from the portal). */
  followUp: (name: string, reference: string) =>
    `Hello ${name}, this is Lanka Veya Travel regarding your request ${reference}. `,
  quotation: (name: string, quoteRef: string, total: string, validUntil: string | null) =>
    `Hello ${name}, your Lanka Veya Travel quotation ${quoteRef} is ready: ${total}${
      validUntil ? `, valid until ${validUntil}` : ""
    }. Please reply here to accept or ask any questions. Your trip is confirmed only once we confirm it with you.`,
  confirmation: (name: string, reference: string) =>
    `Hello ${name}, we're pleased to confirm your Lanka Veya Travel booking ${reference}. We'll be in touch with the final details.`,
};
