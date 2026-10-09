# Lanka Veya Travel

Website and owner portal for **Lanka Veya Travel** — Sri Lanka private tours, airport transfers and chauffeur services, built around a **quote-first** model: visitors send requests, the owner prepares quotations, and trips are confirmed only by an explicit owner action.

- Public site: home, tours, destinations, transport, vehicles, custom trip planner, contact, FAQ, legal pages
- Owner portal (`/admin`): dashboard, bookings, quotations, customers, trip requests & messages, vehicles, drivers & assignments, pricing rules, tours & destinations CMS, content, settings & external links, reports/CSV exports, email delivery log, audit history, team

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions, `proxy.ts`), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn-style primitives in `src/components/ui`, Lucide icons |
| Data | Supabase Postgres with Row Level Security on every table, Supabase Auth, Supabase Storage |
| Forms | React Hook Form + Zod on the client, Zod again on the server (authoritative) |
| Email | Resend (optional; failures never lose a request) |
| Tests | Vitest (unit), SQL test suite (RLS + workflow), Playwright (end-to-end) |
| Hosting | Vercel + Supabase |

Fonts (Fraunces, Figtree) are self-hosted from `src/app/fonts` under the SIL Open Font License. Default photography is from Unsplash (free licence) and credited on each page; replace it with your own photos in the portal.

## Project structure

```
src/
  app/
    (site)/            Public website (server-rendered, revalidated every 5 min or on CMS save)
      actions.ts       Public form Server Actions: validate → rate-limit → save → notify
    admin/
      login, auth/     Sign-in, invitation & password-reset links (no public registration)
      (portal)/        Protected owner portal; every page calls requireStaff()
    api/admin/export/  Staff-only CSV exports
    sitemap.ts, robots.ts
  components/          site/ (public), admin/ (portal), forms/, ui/ (primitives)
  lib/
    auth.ts            Data Access Layer: verified session + active profile + role
    supabase/          session (RLS) client, public (anon) client, service client (server only)
    booking/status.ts  Booking & quotation state machines (mirrors the database)
    pricing/           Decimal-safe quotation maths and pricing-rule estimates
    validation/        Zod schemas
    notify/            Email delivery + templates
  proxy.ts             Session refresh + redirect for /admin (convenience only)
supabase/
  migrations/          Schema, RLS & procedures, storage bucket, CMS procedures
  seed.sql             Production-safe starter content (destinations, FAQs, settings)
  seed-dev.sql         DEVELOPMENT ONLY sample tours/vehicles/pricing
  tests/               SQL tests for RLS and the booking workflow
  templates/           Auth email templates (invite, recovery)
scripts/
  bootstrap-admin.mjs  Creates/promotes the first owner
  local-stack/         Docker-free local Supabase (Postgres + Auth + PostgREST)
tests/unit, tests/e2e  Vitest and Playwright suites
docs/                  Deployment, security and platform guides, test report
```

## How the booking workflow works

1. A visitor submits a request (tour, transfer, driver) or a custom trip request. The server validates it with Zod, checks a honeypot, minimum fill time and a per-visitor rate limit, de-duplicates the customer (email, then phone when emails don't conflict), and saves it with the service key. Status is always `NEW_INQUIRY`; prices and statuses from the browser are ignored.
2. A non-sequential reference (e.g. `LVT-7KQ2-M9XD`) is shown on the confirmation page, which states the trip **is not confirmed yet**.
3. The owner is emailed (if configured). If email fails, the request is still saved and the failure is listed in *Email deliveries* with a retry button.
4. In the portal the owner contacts the customer, builds a quotation (line items, discount, inclusions/exclusions, validity, terms) using pricing rules as estimates, and marks it sent (optionally emailing it). Sent quotations are locked; changes create a new version.
5. When the customer accepts, the owner records it. **Confirming** the booking is a separate step that requires an owner/admin, an accepted quotation and an explicit availability check — enforced by the database, not just the UI.
6. Every status change is written to the booking history with who and when; important admin actions go to the append-only audit log.

## Local development

Requirements: Node 20.9+ (22 recommended), and either the Supabase CLI with Docker, or the docker-free local stack below.

```bash
npm install
cp .env.example .env.local
```

**Option A — Supabase CLI (Docker):**

```bash
npx supabase start            # applies migrations + seed.sql + seed-dev.sql
npx supabase status           # copy API URL, anon/publishable and service keys into .env.local
```

**Option B — docker-free local stack** (Postgres 15+, the Supabase Auth binary and PostgREST from their GitHub releases):

```bash
PG_BIN=/usr/lib/postgresql/16/bin AUTH_BIN=/path/to/auth POSTGREST_BIN=/path/to/postgrest npm run local:stack
cat .local-stack/env >> .env.local   # local-only keys
```

Then create a local owner and run the app:

```bash
BOOTSTRAP_PASSWORD='choose-a-local-password' node --env-file=.env.local scripts/bootstrap-admin.mjs --email you@example.com --name "Your Name"
npm run dev        # http://localhost:3000  ·  portal: /admin
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | Vitest unit tests |
| `npm run test:db` | SQL RLS/workflow tests against a **local** database (refuses hosted URLs) |
| `npm run test:e2e` | Playwright journeys (needs the app running and `E2E_OWNER_PASSWORD`, optional `E2E_STAFF_PASSWORD`) |
| `npm run local:stack` | Start the docker-free local Supabase stack |

## Creating the first administrator

There is no public sign-up. In production, invite the owner by email (they set their own password via the link):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=<secret> SITE_URL=https://lankaveyatravel.com \
  node scripts/bootstrap-admin.mjs --email owner@example.com --name "Owner Name" --invite
```

After that, the owner invites everyone else from **Admin → Team** (roles: staff, admin, owner). New accounts are inactive until an owner activates them; nobody can change their own role.

## Further documentation

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Supabase, auth emails, Resend, Vercel, domain & DNS, backups
- [docs/SECURITY.md](docs/SECURITY.md) — security model and production checklist
- [docs/EXTERNAL-PLATFORMS.md](docs/EXTERNAL-PLATFORMS.md) — Tripadvisor, Google, Booking.com, Viator, GetYourGuide, social
- [docs/TEST-REPORT.md](docs/TEST-REPORT.md) — what was tested and the results
