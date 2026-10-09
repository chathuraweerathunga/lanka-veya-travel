import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { TourSummary } from "@/lib/data/public";

const BASIS: Record<string, string> = { per_person: "per person", per_group: "per group", per_vehicle: "per vehicle" };

/** Shows an indicative "from" price only when the owner configured one; otherwise "Price on request". */
export function PriceLabel({ tour, className }: { tour: Pick<TourSummary, "price_mode" | "price_from" | "price_currency" | "price_basis">; className?: string }) {
  if (tour.price_mode === "INDICATIVE" && tour.price_from && tour.price_currency) {
    return (
      <p className={cn("text-sm text-ink", className)}>
        From <span className="font-semibold">{formatMoney(tour.price_from, tour.price_currency)}</span>{" "}
        {tour.price_basis ? BASIS[tour.price_basis] : null}
        <span className="text-muted"> · indicative, final price in your quotation</span>
      </p>
    );
  }
  return <p className={cn("text-sm text-muted", className)}>Price on request: tailored quotation</p>;
}
