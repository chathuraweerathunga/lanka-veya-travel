import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type BookingStatus, type QuotationStatus } from "@/lib/booking/status";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1.5">
        {back ? (
          <Link href={back.href} className="text-sm text-muted hover:text-teal-700">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="font-display text-3xl text-teal-900">{title}</h1>
        {description ? <div className="text-muted">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border border-line bg-white", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-semibold text-teal-900">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-ivory/60 px-6 py-12 text-center">
      <p className="font-semibold text-teal-900">{title}</p>
      {body ? <p className="mx-auto mt-1 max-w-md text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

const BOOKING_TONE: Record<BookingStatus, Parameters<typeof Badge>[0]["tone"]> = {
  NEW_INQUIRY: "gold",
  CONTACTED: "teal",
  QUOTATION_SENT: "teal",
  AWAITING_CUSTOMER_CONFIRMATION: "warning",
  CONFIRMED: "success",
  IN_PROGRESS: "palm",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={BOOKING_TONE[status]}>{STATUS_LABELS[status]}</Badge>;
}

const QUOTE_TONE: Record<QuotationStatus, Parameters<typeof Badge>[0]["tone"]> = {
  DRAFT: "neutral",
  SENT: "teal",
  ACCEPTED: "success",
  REJECTED: "danger",
  EXPIRED: "warning",
  REVISED: "neutral",
};
export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return <Badge tone={QUOTE_TONE[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>;
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-md border border-line bg-white", className)}>
      <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-2.5 [&_th]:font-medium [&_th]:text-muted [&_thead]:border-b [&_thead]:border-line [&_thead]:bg-ivory/60 [&_tbody_tr]:border-b [&_tbody_tr]:border-line/70 [&_tbody_tr:last-child]:border-0 [&_tbody_tr:hover]:bg-ivory/40">
        {children}
      </table>
    </div>
  );
}

export function DefinitionList({ items, className }: { items: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]", className)}>
      {items
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v], i) => (
          <div key={i} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="break-words">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      <p className="text-muted">
        Page {page} of {pages} · {total} records
      </p>
      <div className="flex gap-2">
        {page > 1 ? <Link className="rounded-md border border-line px-3 py-1.5 hover:border-teal-700" href={hrefFor(page - 1)}>Previous</Link> : null}
        {page < pages ? <Link className="rounded-md border border-line px-3 py-1.5 hover:border-teal-700" href={hrefFor(page + 1)}>Next</Link> : null}
      </div>
    </nav>
  );
}
