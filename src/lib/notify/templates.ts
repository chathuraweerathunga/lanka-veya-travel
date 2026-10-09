import "server-only";
import { escapeHtml } from "./email";

type Row = [label: string, value: string | number | null | undefined];

function table(rows: Row[]) {
  return rows
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#68736f;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 0;color:#202b29">${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
}

function textRows(rows: Row[]) {
  return rows
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

function layout(title: string, intro: string, rows: Row[], cta?: { label: string; url: string }, footer?: string) {
  const html = `<!doctype html><html><body style="margin:0;background:#f7f4ec;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
  <p style="font-family:Georgia,serif;font-size:20px;color:#123f3d;margin:0 0 24px">Lanka Veya Travel</p>
  <div style="background:#fff;border:1px solid #e2ddd1;border-radius:8px;padding:28px">
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:22px;color:#123f3d;margin:0 0 12px">${escapeHtml(title)}</h1>
    <p style="color:#202b29;line-height:1.6;margin:0 0 20px">${escapeHtml(intro)}</p>
    <table style="border-collapse:collapse;font-size:14px;line-height:1.5">${table(rows)}</table>
    ${cta ? `<p style="margin:24px 0 0"><a href="${escapeHtml(cta.url)}" style="background:#123f3d;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px;display:inline-block">${escapeHtml(cta.label)}</a></p>` : ""}
  </div>
  ${footer ? `<p style="color:#68736f;font-size:12px;line-height:1.5;margin:20px 0 0">${escapeHtml(footer)}</p>` : ""}
</div></body></html>`;
  const text = `${title}\n\n${intro}\n\n${textRows(rows)}${cta ? `\n\n${cta.label}: ${cta.url}` : ""}${footer ? `\n\n${footer}` : ""}`;
  return { html, text };
}

const OWNER_FOOTER = "This notification contains customer contact details. Do not forward it outside your team.";

export function ownerNewBookingEmail(p: {
  reference: string;
  service: string;
  tourName?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: string;
  startTime?: string | null;
  pickup?: string | null;
  dropoff?: string | null;
  travellers: string;
  adminUrl: string;
}) {
  const subject = `New request ${p.reference}: ${p.service}${p.tourName ? ` — ${p.tourName}` : ""}`;
  return {
    subject,
    ...layout(
      "New booking request",
      "A visitor submitted a request on the website. It is not confirmed: review it, prepare a quotation and contact the customer.",
      [
        ["Reference", p.reference],
        ["Service", p.service],
        ["Tour", p.tourName],
        ["Name", p.customerName],
        ["Email", p.customerEmail],
        ["WhatsApp / phone", p.customerPhone],
        ["Date", `${p.startDate}${p.startTime ? ` at ${p.startTime}` : ""}`],
        ["Pickup", p.pickup],
        ["Drop-off", p.dropoff],
        ["Travellers", p.travellers],
      ],
      { label: "Open in the owner portal", url: p.adminUrl },
      OWNER_FOOTER,
    ),
  };
}

export function ownerNewTripRequestEmail(p: {
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  dates: string;
  travellers: string;
  destinations: string;
  adminUrl: string;
}) {
  return {
    subject: `New custom trip request ${p.reference}`,
    ...layout(
      "New custom trip request",
      "A visitor asked for a personalised itinerary. Review the details in the owner portal.",
      [
        ["Reference", p.reference],
        ["Name", p.customerName],
        ["Email", p.customerEmail],
        ["WhatsApp / phone", p.customerPhone],
        ["Dates", p.dates],
        ["Travellers", p.travellers],
        ["Destinations", p.destinations],
      ],
      { label: "Open in the owner portal", url: p.adminUrl },
      OWNER_FOOTER,
    ),
  };
}

export function ownerNewContactEmail(p: { reference: string; name: string; email: string; subject?: string; adminUrl: string }) {
  return {
    subject: `New message ${p.reference}${p.subject ? `: ${p.subject}` : ""}`,
    ...layout(
      "New contact message",
      "Someone sent a message through the website contact form.",
      [
        ["Reference", p.reference],
        ["Name", p.name],
        ["Email", p.email],
        ["Subject", p.subject],
      ],
      { label: "Read the message", url: p.adminUrl },
      OWNER_FOOTER,
    ),
  };
}

export function customerQuotationEmail(p: {
  customerName: string;
  quoteReference: string;
  bookingReference: string;
  lines: { description: string; quantity: string; unitPrice: string; lineTotal: string }[];
  subtotal: string;
  discountLabel?: string | null;
  discount: string;
  total: string;
  inclusions: string[];
  exclusions: string[];
  validUntil?: string | null;
  terms?: string | null;
  businessEmail: string;
  whatsappDisplay: string;
}) {
  const rows: Row[] = [
    ["Quotation", p.quoteReference],
    ["Your request", p.bookingReference],
    ...p.lines.map((l): Row => [l.description, `${l.quantity} × ${l.unitPrice} = ${l.lineTotal}`]),
    ["Subtotal", p.subtotal],
    ...(p.discount !== p.subtotal && Number(p.discount.replace(/[^\d.]/g, "")) > 0 ? [[p.discountLabel || "Discount", `− ${p.discount}`] as Row] : []),
    ["Total", p.total],
    ["Includes", p.inclusions.join("\n")],
    ["Not included", p.exclusions.join("\n")],
    ["Valid until", p.validUntil],
    ["Terms", p.terms],
  ];
  return {
    subject: `Your Lanka Veya Travel quotation ${p.quoteReference}`,
    ...layout(
      `Your quotation, ${p.customerName.split(" ")[0]}`,
      "Thank you for planning your journey with us. Here is your personal quotation. Reply to this email or message us on WhatsApp to accept it or ask for changes. Your trip is confirmed only once we confirm it with you.",
      rows,
      undefined,
      `Lanka Veya Travel · ${p.businessEmail} · WhatsApp ${p.whatsappDisplay}`,
    ),
  };
}
