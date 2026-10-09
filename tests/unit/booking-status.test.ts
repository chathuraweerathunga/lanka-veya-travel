import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  BOOKING_STATUSES,
  BOOKING_TRANSITIONS,
  QUOTATION_TRANSITIONS,
  canTransition,
  confirmationBlockers,
  isValidReference,
  type BookingStatus,
} from "@/lib/booking/status";

const schemaSql = fs.readFileSync(path.join(__dirname, "../../supabase/migrations/20261009000100_schema.sql"), "utf8");

function parseSqlTransitions(fnName: string) {
  const body = schemaSql.slice(schemaSql.indexOf(`function public.${fnName}`));
  const block = body.slice(0, body.indexOf("$$;"));
  const map: Record<string, string[]> = {};
  for (const m of block.matchAll(/when '(\w+)' then to_s in \(([^)]*)\)/g)) {
    map[m[1]] = [...m[2].matchAll(/'(\w+)'/g)].map((x) => x[1]).sort();
  }
  return map;
}

describe("booking state machine", () => {
  it("matches the database transition function exactly", () => {
    const sql = parseSqlTransitions("booking_transition_allowed");
    for (const s of BOOKING_STATUSES) {
      expect(sql[s] ?? [], `transitions from ${s}`).toEqual([...BOOKING_TRANSITIONS[s]].sort());
    }
  });

  it("quotation transitions match the database", () => {
    const sql = parseSqlTransitions("quotation_transition_allowed");
    for (const [from, to] of Object.entries(QUOTATION_TRANSITIONS)) {
      expect(sql[from] ?? []).toEqual([...to].sort());
    }
  });

  it("never allows a new inquiry to jump to confirmed or completed", () => {
    expect(canTransition("NEW_INQUIRY", "CONFIRMED")).toBe(false);
    expect(canTransition("NEW_INQUIRY", "COMPLETED")).toBe(false);
    expect(canTransition("CONTACTED", "CONFIRMED")).toBe(false);
  });

  it("treats completed as terminal and lets cancelled bookings be reopened", () => {
    expect(BOOKING_TRANSITIONS.COMPLETED).toHaveLength(0);
    expect(canTransition("CANCELLED", "CONTACTED")).toBe(true);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
  });

  it("every status can eventually reach COMPLETED or is terminal", () => {
    const reachable = (from: BookingStatus, seen = new Set<BookingStatus>()): boolean => {
      if (from === "COMPLETED") return true;
      seen.add(from);
      return BOOKING_TRANSITIONS[from].some((n) => !seen.has(n) && reachable(n, seen));
    };
    for (const s of BOOKING_STATUSES) expect(reachable(s)).toBe(true);
  });
});

describe("confirmation requires explicit owner action", () => {
  const ready = { hasAcceptedQuotation: true, availabilityChecked: true, actorIsAdmin: true };
  it("is allowed only when every check passes", () => {
    expect(confirmationBlockers("AWAITING_CUSTOMER_CONFIRMATION", ready)).toEqual([]);
    expect(confirmationBlockers("QUOTATION_SENT", ready)).toEqual([]);
  });
  it("lists each missing step", () => {
    const r = confirmationBlockers("CONTACTED", { hasAcceptedQuotation: false, availabilityChecked: false, actorIsAdmin: false });
    expect(r).toHaveLength(4);
    expect(confirmationBlockers("QUOTATION_SENT", { ...ready, hasAcceptedQuotation: false })).toEqual([
      "Record the customer's acceptance of a quotation first.",
    ]);
  });
});

describe("references", () => {
  it("accepts generated formats and rejects ambiguous characters", () => {
    expect(isValidReference("LVT-7KQ2-M9XD")).toBe(true);
    expect(isValidReference("LVT-T-7KQ2-M9XD")).toBe(true);
    expect(isValidReference("LVT-C-ABCD-2345")).toBe(true);
    expect(isValidReference("LVT-0OIL-1234")).toBe(false);
    expect(isValidReference("lvt-7kq2-m9xd")).toBe(false);
    expect(isValidReference("LVT-7KQ2-M9XD; drop table")).toBe(false);
  });
  it("database alphabet matches the validator", () => {
    const alphabet = schemaSql.match(/alphabet constant text := '([A-Z0-9]+)'/)![1];
    for (const ch of alphabet) expect(isValidReference(`LVT-${ch.repeat(4)}-${ch.repeat(4)}`)).toBe(true);
    expect(alphabet).not.toMatch(/[01ILOU]/);
  });
});
