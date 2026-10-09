import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export type EditablePageKey = "page_about" | "page_privacy" | "page_terms" | "page_cancellation";
export type EditablePage = { title: string; intro: string; body: string; updated_on: string };

/**
 * Default copy. Legal pages are deliberately conservative templates: the owner
 * should have them reviewed and can edit them in Admin → Website content.
 */
export const DEFAULT_PAGES: Record<EditablePageKey, EditablePage> = {
  page_about: {
    title: "About Lanka Veya Travel",
    intro: "We arrange private journeys around Sri Lanka: tours, transfers and drivers, planned personally for each traveller.",
    updated_on: "",
    body: `## What we do
We plan private trips across Sri Lanka for travellers who want to see the island at their own pace. That includes round tours and day trips, airport and hotel transfers, and a car with a driver for a day or for your whole stay.

## How we work
Every journey starts with a conversation. You tell us your dates, who is travelling and what you would like to experience. We suggest a route and vehicle, check availability, and send you a clear quotation showing what is and isn't included.

Nothing is confirmed until you have accepted the quotation and we have confirmed the trip with you directly. We don't take payments on this website.

## What you can expect
- A private vehicle and driver for your group only
- Itineraries shaped around your interests rather than fixed departures
- Clear quotations before you commit
- Easy contact on WhatsApp and email before and during your trip`,
  },
  page_privacy: {
    title: "Privacy policy",
    intro: "How we collect and use your personal information when you contact us or request a quotation.",
    updated_on: "2026-10-09",
    body: `## Who we are
This website is operated by Lanka Veya Travel. You can contact us about privacy at the email address shown on our contact page.

## Information we collect
When you send a request or message, we collect the details you enter: your name, email address, phone or WhatsApp number, travel dates, number of travellers, pickup and destination details, and any notes you choose to share. We also record the date and time of your request.

To protect our forms from abuse we keep a short-lived, one-way hashed value derived from your connection details. We do not store your IP address in readable form.

## How we use it
We use your information only to respond to your request, prepare and send quotations, arrange and confirm your trip, and keep records of our bookings. We do not sell your information or use it for unrelated marketing.

## Service providers
We use trusted providers to run this website and our booking records, such as website hosting, a database provider and an email delivery service. They process data on our behalf only to provide those services.

## How long we keep it
We keep request and booking records for as long as needed to provide our services and meet our legal and accounting obligations, after which they are deleted or anonymised.

## Your choices
You can ask us to access, correct or delete the personal information we hold about you by contacting us. If you are in a country with data protection laws, you may also have the right to complain to your local regulator.

## Changes
We may update this policy from time to time. The date at the top shows when it last changed.`,
  },
  page_terms: {
    title: "Terms & conditions",
    intro: "The basis on which we handle requests, quotations and bookings.",
    updated_on: "2026-10-09",
    body: `## Requests are not bookings
Submitting a form on this website sends us a request. It does not reserve a vehicle, driver, tour or any other service, and it does not create a contract.

## Quotations
After reviewing your request we may send you a quotation. Each quotation states its price, currency, what is included and excluded, and how long it is valid. Prices on this website are indicative only; the price that applies is the one in your accepted quotation.

## Confirmation
A booking is confirmed only when we confirm it to you in writing by WhatsApp or email after you have accepted a quotation. Any specific terms in your quotation, including payment and cancellation terms, form part of your booking.

## Changes and availability
Routes, timings and vehicles can be affected by weather, road conditions and other events outside our control. We will always tell you as soon as possible if something needs to change.

## Your responsibilities
Please give us accurate details, including flight times and the number of travellers and bags, and tell us promptly about any changes.

## Contact
If you have any questions about these terms, please contact us before you confirm your booking.`,
  },
  page_cancellation: {
    title: "Cancellation policy",
    intro: "How cancellations and changes work for trips arranged with us.",
    updated_on: "2026-10-09",
    body: `## Before your trip is confirmed
You can withdraw a request or decline a quotation at any time before your booking is confirmed, at no cost.

## After confirmation
Cancellation and change terms depend on the services in your trip and are set out in your quotation before you accept it. Please read them carefully, and ask us if anything is unclear.

## How to cancel or change
Contact us by WhatsApp or email and quote your booking reference. We will confirm any cancellation or change in writing.

## If we need to cancel
If we have to cancel a confirmed service, we will contact you as soon as possible to offer an alternative or explain the next steps as set out in your quotation.`,
  },
};

export async function getEditablePage(key: EditablePageKey): Promise<EditablePage> {
  const db = createPublicClient();
  if (!db) return DEFAULT_PAGES[key];
  const { data } = await db.from("site_settings").select("value").eq("key", key).maybeSingle();
  const value = (data?.value ?? {}) as Partial<EditablePage>;
  return { ...DEFAULT_PAGES[key], ...Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === "string" && v.trim())) };
}
