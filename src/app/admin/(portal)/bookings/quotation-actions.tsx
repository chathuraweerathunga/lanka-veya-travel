"use client";

import { ActionForm, CheckboxField, SubmitButton } from "@/components/admin/action-form";
import { emailQuotationAgain, reviseQuotation, sendQuotation, setQuotationOutcome } from "./actions";

export function SendQuotationForm({ bookingId, quotationId, hasEmail }: { bookingId: string; quotationId: string; hasEmail: boolean }) {
  return (
    <ActionForm action={sendQuotation} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="quotationId" value={quotationId} />
      {hasEmail ? <CheckboxField name="emailCustomer" defaultChecked label="Also email it to the customer" /> : <p className="text-sm text-muted">No email on file: share it on WhatsApp after marking it sent.</p>}
      <SubmitButton>Mark as sent</SubmitButton>
      <p className="text-xs text-muted">Once sent, prices are locked. Create a revision to change them.</p>
    </ActionForm>
  );
}

export function OutcomeButtons({ bookingId, quotationId }: { bookingId: string; quotationId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["ACCEPTED", "REJECTED", "EXPIRED"] as const).map((o) => (
        <ActionForm key={o} action={setQuotationOutcome}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="quotationId" value={quotationId} />
          <input type="hidden" name="outcome" value={o} />
          <SubmitButton size="sm" variant={o === "ACCEPTED" ? "primary" : "outline"}>
            {o === "ACCEPTED" ? "Customer accepted" : o === "REJECTED" ? "Customer declined" : "Mark expired"}
          </SubmitButton>
        </ActionForm>
      ))}
    </div>
  );
}

export function ReviseButton({ bookingId, quotationId }: { bookingId: string; quotationId: string }) {
  return (
    <ActionForm action={reviseQuotation}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="quotationId" value={quotationId} />
      <SubmitButton size="sm" variant="outline">Create revision</SubmitButton>
    </ActionForm>
  );
}

export function EmailAgainButton({ bookingId, quotationId }: { bookingId: string; quotationId: string }) {
  return (
    <ActionForm action={emailQuotationAgain}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="quotationId" value={quotationId} />
      <SubmitButton size="sm" variant="outline">Email to customer</SubmitButton>
    </ActionForm>
  );
}
