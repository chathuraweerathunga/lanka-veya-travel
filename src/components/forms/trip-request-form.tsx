"use client";

import Link from "next/link";
import { submitTripRequest } from "@/app/(site)/actions";
import { ACCOMMODATION, ACTIVITIES, tripRequestSchema } from "@/lib/validation/public-forms";
import { Field, Input, Select, Textarea, describedBy } from "@/components/ui/field";
import { useActionForm } from "./use-action-form";
import { FormSection, FormSummary, Honeypot, PRIVACY_NOTE, SubmitButton } from "./form-bits";

export function TripRequestForm({ destinations, currencies }: { destinations: string[]; currencies: { code: string; name: string }[] }) {
  const { form, formRef, onSubmit, pending, state, errorFor, summaryRef } = useActionForm(tripRequestSchema, submitTripRequest, {
    adults: "2",
    children: "0",
    destinations: [],
    activities: [],
    website: "",
  });
  const { register } = form;
  const f = (name: string, hint?: boolean) => ({
    id: name,
    "aria-invalid": errorFor(name) ? true : undefined,
    "aria-describedby": describedBy(name, errorFor(name), hint ? "y" : undefined),
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative space-y-10">
      <FormSummary message={state.message} summaryRef={summaryRef} />
      <input type="hidden" {...register("submissionKey")} />
      <input type="hidden" {...register("startedAt")} />
      <Honeypot register={() => register("website")} />

      <FormSection title="When" description="Approximate dates are fine.">
        <Field id="arrivalDate" label="Arrival date" required error={errorFor("arrivalDate")}>
          <Input type="date" {...register("arrivalDate")} {...f("arrivalDate")} />
        </Field>
        <Field id="departureDate" label="Departure date" required error={errorFor("departureDate")}>
          <Input type="date" {...register("departureDate")} {...f("departureDate")} />
        </Field>
        <Field id="startLocation" label="Arriving at" hint="Airport, hotel or town" error={errorFor("startLocation")} className="sm:col-span-2">
          <Input {...register("startLocation")} {...f("startLocation", true)} placeholder="Bandaranaike International Airport (CMB)" />
        </Field>
      </FormSection>

      <FormSection title="Who's travelling">
        <Field id="adults" label="Adults" required error={errorFor("adults")}>
          <Input type="number" inputMode="numeric" min={1} max={60} {...register("adults")} {...f("adults")} />
        </Field>
        <Field id="children" label="Children" error={errorFor("children")}>
          <Input type="number" inputMode="numeric" min={0} max={40} {...register("children")} {...f("children")} />
        </Field>
      </FormSection>

      <FormSection title="Where & what" description="Choose any that appeal. Leave blank if you'd like our suggestions.">
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-ink">Places you&apos;d like to visit</legend>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 md:grid-cols-3">
            {destinations.map((d) => (
              <label key={d} className="flex items-center gap-2.5 text-[0.95rem]">
                <input type="checkbox" value={d} {...register("destinations")} className="size-4 accent-teal-900" />
                {d}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-ink">Experiences</legend>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 md:grid-cols-3">
            {ACTIVITIES.map((a) => (
              <label key={a} className="flex items-center gap-2.5 text-[0.95rem]">
                <input type="checkbox" value={a} {...register("activities")} className="size-4 accent-teal-900" />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
        <Field id="accommodation" label="Accommodation style" error={errorFor("accommodation")}>
          <Select {...register("accommodation")} {...f("accommodation")}>
            <option value="">Not sure yet</option>
            {ACCOMMODATION.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="transportPreference" label="Transport preference" error={errorFor("transportPreference")}>
          <Input {...register("transportPreference")} {...f("transportPreference")} placeholder="e.g. SUV with driver, some train travel" />
        </Field>
      </FormSection>

      <FormSection title="Budget" description="Optional. Helps us suggest the right hotels and pace.">
        <Field id="budgetMin" label="From" error={errorFor("budgetMin")}>
          <Input type="number" inputMode="decimal" min={0} {...register("budgetMin")} {...f("budgetMin")} />
        </Field>
        <Field id="budgetMax" label="Up to" error={errorFor("budgetMax")}>
          <Input type="number" inputMode="decimal" min={0} {...register("budgetMax")} {...f("budgetMax")} />
        </Field>
        <Field id="budgetCurrency" label="Currency" hint="For the whole trip, all travellers" error={errorFor("budgetCurrency")} className="sm:col-span-2">
          <Select {...register("budgetCurrency")} {...f("budgetCurrency", true)}>
            <option value="">Choose a currency</option>
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>

      <FormSection title="Anything else">
        <Field id="specialRequirements" label="Special requirements" hint="Dietary needs, mobility, celebrations" error={errorFor("specialRequirements")} className="sm:col-span-2">
          <Textarea {...register("specialRequirements")} {...f("specialRequirements", true)} rows={3} />
        </Field>
        <Field id="notes" label="Tell us about your ideal trip" error={errorFor("notes")} className="sm:col-span-2">
          <Textarea {...register("notes")} {...f("notes")} rows={5} />
        </Field>
      </FormSection>

      <FormSection title="Your details">
        <Field id="fullName" label="Full name" required error={errorFor("fullName")}>
          <Input {...register("fullName")} {...f("fullName")} autoComplete="name" />
        </Field>
        <Field id="email" label="Email" required error={errorFor("email")}>
          <Input type="email" {...register("email")} {...f("email")} autoComplete="email" />
        </Field>
        <Field id="phone" label="WhatsApp or phone" required hint="Include your country code" error={errorFor("phone")} className="sm:col-span-2">
          <Input type="tel" {...register("phone")} {...f("phone", true)} autoComplete="tel" />
        </Field>
      </FormSection>

      <div className="space-y-6 border-t border-line pt-8">
        <div className="space-y-1.5">
          <label className="flex items-start gap-3 text-[0.95rem]">
            <input type="checkbox" value="on" {...register("consent")} aria-invalid={errorFor("consent") ? true : undefined} aria-describedby={errorFor("consent") ? "consent-error" : undefined} className="mt-1 size-4 accent-teal-900" />
            <span>
              I agree to the <Link href="/privacy-policy" className="text-teal-700 underline underline-offset-4" target="_blank">privacy policy</Link>. {PRIVACY_NOTE}
            </span>
          </label>
          {errorFor("consent") ? <p id="consent-error" className="text-sm text-danger" role="alert">{errorFor("consent")}</p> : null}
        </div>
        <p className="text-sm text-muted">We&apos;ll reply with a suggested route and quotation. Nothing is booked until we confirm it with you.</p>
        <SubmitButton pending={pending}>Send my trip request</SubmitButton>
      </div>
    </form>
  );
}
