"use client";

import Link from "next/link";
import { submitContact } from "@/app/(site)/actions";
import { contactSchema } from "@/lib/validation/public-forms";
import { Field, Input, Textarea, describedBy } from "@/components/ui/field";
import { useActionForm } from "./use-action-form";
import { FormSummary, Honeypot, PRIVACY_NOTE, SubmitButton } from "./form-bits";

export function ContactForm() {
  const { form, formRef, onSubmit, pending, state, errorFor, summaryRef } = useActionForm(contactSchema, submitContact, { website: "" });
  const { register } = form;
  const f = (name: string) => ({ id: name, "aria-invalid": errorFor(name) ? true : undefined, "aria-describedby": describedBy(name, errorFor(name)) });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative space-y-5">
      <FormSummary message={state.message} summaryRef={summaryRef} />
      <input type="hidden" {...register("submissionKey")} />
      <input type="hidden" {...register("startedAt")} />
      <Honeypot register={() => register("website")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label="Full name" required error={errorFor("fullName")}>
          <Input {...register("fullName")} {...f("fullName")} autoComplete="name" />
        </Field>
        <Field id="email" label="Email" required error={errorFor("email")}>
          <Input type="email" {...register("email")} {...f("email")} autoComplete="email" />
        </Field>
        <Field id="phone" label="WhatsApp or phone" error={errorFor("phone")}>
          <Input type="tel" {...register("phone")} {...f("phone")} autoComplete="tel" />
        </Field>
        <Field id="subject" label="Subject" error={errorFor("subject")}>
          <Input {...register("subject")} {...f("subject")} />
        </Field>
        <Field id="message" label="Message" required error={errorFor("message")} className="sm:col-span-2">
          <Textarea {...register("message")} {...f("message")} rows={6} />
        </Field>
      </div>
      <div className="space-y-1.5">
        <label className="flex items-start gap-3 text-[0.95rem]">
          <input type="checkbox" value="on" {...register("consent")} aria-invalid={errorFor("consent") ? true : undefined} className="mt-1 size-4 accent-teal-900" />
          <span>
            I agree to the <Link href="/privacy-policy" className="text-teal-700 underline underline-offset-4" target="_blank">privacy policy</Link>. {PRIVACY_NOTE}
          </span>
        </label>
        {errorFor("consent") ? <p className="text-sm text-danger" role="alert">{errorFor("consent")}</p> : null}
      </div>
      <SubmitButton pending={pending}>Send message</SubmitButton>
    </form>
  );
}
