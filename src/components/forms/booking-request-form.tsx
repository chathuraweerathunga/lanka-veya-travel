"use client";

import Link from "next/link";
import { useWatch } from "react-hook-form";
import { submitBookingRequest } from "@/app/(site)/actions";
import { bookingRequestSchema } from "@/lib/validation/public-forms";
import { SERVICE_LABELS, SERVICE_TYPES } from "@/lib/booking/status";
import { Field, Input, Select, Textarea, describedBy } from "@/components/ui/field";
import { useActionForm } from "./use-action-form";
import { FormSection, FormSummary, Honeypot, PRIVACY_NOTE, SubmitButton } from "./form-bits";

const ROUTE_SERVICES = new Set(["AIRPORT_TRANSFER", "HOTEL_TRANSFER", "POINT_TO_POINT"]);
const MULTI_DAY = new Set(["TOUR", "MULTI_DAY_CHAUFFEUR", "CUSTOM_ITINERARY", "DAY_HIRE", "PRIVATE_SIGHTSEEING", "OTHER"]);
const PUBLIC_SERVICES = SERVICE_TYPES.filter((s) => s !== "CUSTOM_ITINERARY");

export type BookingFormDefaults = {
  serviceType?: string;
  tourSlug?: string;
  tourName?: string;
  startDate?: string;
  adults?: string;
  vehiclePreference?: string;
};

export function BookingRequestForm({ defaults, vehicleOptions }: { defaults: BookingFormDefaults; vehicleOptions: string[] }) {
  const { form, formRef, onSubmit, pending, state, errorFor, summaryRef } = useActionForm(bookingRequestSchema, submitBookingRequest, {
    serviceType: (defaults.serviceType as never) ?? "AIRPORT_TRANSFER",
    tourSlug: defaults.tourSlug ?? "",
    startDate: defaults.startDate ?? "",
    adults: defaults.adults ?? "2",
    children: "0",
    preferredContact: "whatsapp",
    vehiclePreference: defaults.vehiclePreference ?? "",
    website: "",
  });
  const { register } = form;
  const service = useWatch({ control: form.control, name: "serviceType" }) as string;
  const needsRoute = ROUTE_SERVICES.has(service);
  const isAirport = service === "AIRPORT_TRANSFER";

  const f = (name: string, hint?: string) => ({
    id: name,
    "aria-invalid": errorFor(name) ? true : undefined,
    "aria-describedby": describedBy(name, errorFor(name), hint),
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative space-y-10">
      <FormSummary message={state.message} summaryRef={summaryRef} />
      <input type="hidden" {...register("submissionKey")} />
      <input type="hidden" {...register("startedAt")} />
      <input type="hidden" {...register("tourSlug")} />
      <Honeypot register={() => register("website")} />

      <FormSection title="Your trip" description={defaults.tourName ? `Tour: ${defaults.tourName}` : "What would you like us to arrange?"}>
        <Field id="serviceType" label="Service" required error={errorFor("serviceType")} className="sm:col-span-2">
          <Select {...register("serviceType")} {...f("serviceType")}>
            {PUBLIC_SERVICES.map((s) => (
              <option key={s} value={s}>
                {SERVICE_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>

        {needsRoute ? (
          <>
            <Field id="pickupLocation" label={isAirport ? "Pickup (airport or hotel)" : "Pickup location"} required error={errorFor("pickupLocation")}>
              <Input {...register("pickupLocation")} {...f("pickupLocation")} placeholder={isAirport ? "Bandaranaike International Airport (CMB)" : "Hotel or address"} autoComplete="off" />
            </Field>
            <Field id="dropoffLocation" label="Drop-off location" required error={errorFor("dropoffLocation")}>
              <Input {...register("dropoffLocation")} {...f("dropoffLocation")} placeholder="Hotel, town or address" autoComplete="off" />
            </Field>
          </>
        ) : (
          <Field id="pickupLocation" label="Starting point" hint="Hotel, town or airport, if you know it" error={errorFor("pickupLocation")} className="sm:col-span-2">
            <Input {...register("pickupLocation")} {...f("pickupLocation", "x")} autoComplete="off" />
          </Field>
        )}

        <Field id="startDate" label={MULTI_DAY.has(service) ? "Start date" : "Date"} required error={errorFor("startDate")}>
          <Input type="date" {...register("startDate")} {...f("startDate")} />
        </Field>
        <Field id="startTime" label={isAirport ? "Pickup or flight time" : "Preferred time"} hint="24-hour, Sri Lanka time" error={errorFor("startTime")}>
          <Input type="time" {...register("startTime")} {...f("startTime", "x")} />
        </Field>
        {MULTI_DAY.has(service) ? (
          <Field id="endDate" label="End date" hint="Leave empty for a single day" error={errorFor("endDate")}>
            <Input type="date" {...register("endDate")} {...f("endDate", "x")} />
          </Field>
        ) : null}
        {isAirport ? (
          <Field id="flightNumber" label="Flight number" hint="Helps us track delays" error={errorFor("flightNumber")}>
            <Input {...register("flightNumber")} {...f("flightNumber", "x")} placeholder="e.g. UL 504" autoComplete="off" />
          </Field>
        ) : null}
      </FormSection>

      <FormSection title="Travellers" description="So we can suggest the right vehicle.">
        <Field id="adults" label="Adults" required error={errorFor("adults")}>
          <Input type="number" inputMode="numeric" min={1} max={60} {...register("adults")} {...f("adults")} />
        </Field>
        <Field id="children" label="Children" error={errorFor("children")}>
          <Input type="number" inputMode="numeric" min={0} max={40} {...register("children")} {...f("children")} />
        </Field>
        <Field id="luggage" label="Large bags" hint="Suitcases and large backpacks" error={errorFor("luggage")}>
          <Input type="number" inputMode="numeric" min={0} max={100} {...register("luggage")} {...f("luggage", "x")} />
        </Field>
        <Field id="vehiclePreference" label="Vehicle preference" error={errorFor("vehiclePreference")}>
          <Select {...register("vehiclePreference")} {...f("vehiclePreference")}>
            <option value="">No preference</option>
            {vehicleOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="requirements" label="Anything else?" hint="Child seats, accessibility needs, places you'd like to stop" error={errorFor("requirements")} className="sm:col-span-2">
          <Textarea {...register("requirements")} {...f("requirements", "x")} rows={4} />
        </Field>
      </FormSection>

      <FormSection title="Your details" description="We'll send your quotation here.">
        <Field id="fullName" label="Full name" required error={errorFor("fullName")}>
          <Input {...register("fullName")} {...f("fullName")} autoComplete="name" />
        </Field>
        <Field id="email" label="Email" required error={errorFor("email")}>
          <Input type="email" {...register("email")} {...f("email")} autoComplete="email" />
        </Field>
        <Field id="phone" label="WhatsApp or phone" required hint="Include your country code" error={errorFor("phone")}>
          <Input type="tel" {...register("phone")} {...f("phone", "x")} autoComplete="tel" placeholder="+44 7700 900123" />
        </Field>
        <Field id="country" label="Country of residence" error={errorFor("country")}>
          <Input {...register("country")} {...f("country")} autoComplete="country-name" />
        </Field>
        <Field id="preferredContact" label="Best way to reach you" error={errorFor("preferredContact")} className="sm:col-span-2">
          <Select {...register("preferredContact")} {...f("preferredContact")}>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="phone">Phone call</option>
          </Select>
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
          {errorFor("consent") ? (
            <p id="consent-error" className="text-sm text-danger" role="alert">
              {errorFor("consent")}
            </p>
          ) : null}
        </div>
        <p className="text-sm text-muted">This is a request, not a booking. Nothing is reserved or charged until we confirm your trip with you.</p>
        <SubmitButton pending={pending}>Send request</SubmitButton>
      </div>
    </form>
  );
}
