import { SERVICE_LABELS } from "@/lib/booking/status";

const OPTIONS = ["AIRPORT_TRANSFER", "TOUR", "DAY_HIRE", "MULTI_DAY_CHAUFFEUR", "POINT_TO_POINT"] as const;

/** Works without JavaScript: a GET form that pre-fills the full request page. */
export function QuickQuotePanel() {
  return (
    <form
      action="/request-quote"
      method="get"
      className="rounded-md bg-white p-6 text-ink shadow-[0_24px_60px_-28px_rgba(11,39,38,0.6)] md:p-7"
      aria-labelledby="quick-quote-title"
    >
      <h2 id="quick-quote-title" className="font-display text-2xl text-teal-900">
        Request a quote
      </h2>
      <p className="mt-1 text-sm text-muted">Free and without obligation. We reply personally.</p>
      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="qq-service" className="text-sm font-medium">I&apos;m looking for</label>
          <select id="qq-service" name="service" className="h-11 w-full rounded-md border border-line bg-white px-3 text-[0.98rem] focus:border-teal-700 focus:outline-none">
            {OPTIONS.map((o) => (
              <option key={o} value={o}>
                {SERVICE_LABELS[o]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <div className="space-y-1.5">
            <label htmlFor="qq-date" className="text-sm font-medium">Date</label>
            <input id="qq-date" type="date" name="date" className="h-11 w-full rounded-md border border-line px-3 text-[0.98rem] focus:border-teal-700 focus:outline-none" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="qq-adults" className="text-sm font-medium">Adults</label>
            <input id="qq-adults" type="number" name="adults" min={1} max={60} defaultValue={2} className="h-11 w-full rounded-md border border-line px-3 text-[0.98rem] focus:border-teal-700 focus:outline-none" />
          </div>
        </div>
        <button type="submit" className="h-12 w-full rounded-md bg-teal-900 font-medium text-white transition-colors hover:bg-teal-800">
          Continue
        </button>
      </div>
    </form>
  );
}
