# Test report

Date: 9 October 2026. Environment: Linux sandbox, Node 22.22, Next.js 16.4.0, PostgreSQL 16 with the Supabase Auth (GoTrue v2.180) and PostgREST v12.2 binaries behind a local gateway (`scripts/local-stack`). No hosted Supabase project, Resend account or Vercel deployment was available, so those integrations were **not** tested live.

## Results

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | Pass (0 warnings) |
| Typecheck | `npm run typecheck` | Pass |
| Unit tests | `npm test` | **48 / 48 pass** — quotation maths, pricing estimates, booking & quotation state machines (verified identical to the SQL functions), reference format, Zod validation, spam heuristics, phone normalisation, WhatsApp links, money formatting, CSV escaping, upload type sniffing |
| Database tests | `npm run test:db` | **55 / 55 pass** — RLS for anon / inactive / staff / owner, column privacy, privilege escalation blocked, booking transitions, confirmation guards (accepted quotation + availability check + admin), cancellation reason, quotation locking & revisions, server-side totals, assignment conflict detection, customer de-duplication, rate limiting, dashboard metrics |
| Fresh install | migrations + `seed.sql` + `seed-dev.sql` on an empty database, then DB tests | Pass |
| Production build | `npm run build` (with and without environment variables) | Pass — 38 static/ISR routes, admin routes dynamic |
| End-to-end | `npm run test:e2e` against `next start` | **12 / 12 pass** (desktop + mobile viewport) |

### End-to-end journeys covered
- Every public page returns 200 with one `h1` and a unique title (desktop and mobile).
- Homepage headline, primary CTA and WhatsApp link to `wa.me/94776205149`.
- Mobile and desktop navigation.
- Booking request: client validation errors, successful save, `LVT-XXXX-XXXX` reference, "Your trip is not confirmed yet." copy.
- Admin routes redirect to sign-in; CSV export refuses anonymous requests; `/admin` is `noindex` and `no-store`.
- Owner journey: visitor request → owner signs in → creates quotation → saves draft (server-calculated total) → marks sent → records acceptance → confirmation blocked without availability check → confirmed with check.
- Staff are redirected away from Settings and Team.

### Additional manual/browser checks performed during development
- Wrong password rejected; form keeps the typed email.
- Contact form: saved, linked to the existing customer by case-insensitive email; too-fast submission rejected with a clear message.
- Email not configured → request saved, delivery logged as *skipped* with an actionable message.
- Vehicle assignment; overlapping assignment on another booking flagged as a conflict; private notes.
- Tour created in the CMS with itinerary and destination, publishing blocked until alt text is given, then visible on the public site.
- Settings rejected a `javascript:` URL; a valid Tripadvisor URL appeared in the public footer.
- Pricing rule, FAQ (visible publicly), testimonial publishing blocked without "genuine" confirmation; contact message converted into a booking.
- Text typed before the page finished loading is kept after hydration.

## Not executed / limitations
- **Live Supabase project**: account was at its free-project limit, so migrations were tested on local PostgreSQL 16 with Supabase's own Auth and PostgREST. Hosted Supabase runs PostgreSQL 15/17 with the same features used here.
- **Supabase Storage**: uploads were exercised against a minimal local emulator, not the real Storage API.
- **Email delivery** (Resend) and **invitation/reset emails**: not sent; only the not-configured path was verified.
- **Vercel deployment, domain, DNS, HTTPS**: not performed.
- **Remote images**: the sandbox blocks images.unsplash.com, so photography didn't render in screenshots; layouts were reviewed without photos.
- Automated accessibility scanning (axe) and Lighthouse were not run; semantic structure, labels, focus styles, keyboard menus and reduced-motion support were implemented and spot-checked.
