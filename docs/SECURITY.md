# Security model & production checklist

## Model

| Actor | Can | Cannot |
| --- | --- | --- |
| Visitor (`anon`) | Read published tours/destinations, published FAQs/testimonials, public settings, active public vehicles (non-internal columns only). Submit forms **through the server**. | Read customers, bookings, quotations, notes, pricing, drivers, private settings; insert/update/delete anything directly; call privileged functions. |
| Signed-in but inactive user | Read their own profile. | Anything else (every private policy requires an active profile). |
| Staff | Manage requests, bookings, quotations, customers, assignments, fleet, drivers, tours, destinations, FAQs, testimonials; export CSVs. | Confirm bookings; change settings/pricing/currencies; see driver licences; read the audit log; manage the team. |
| Admin | Everything staff can, plus confirm bookings, settings, pricing, audit log, driver private data. | Manage the team. |
| Owner | Everything, including invitations, roles and activation. | Change their own role/activation. |

Enforcement happens in three layers:

1. **Postgres RLS** on every table in `public` (`supabase/migrations/20261009000200_rls_and_rpc.sql`), column-level grants for vehicles and profiles, and triggers that guard role changes, booking transitions, confirmation requirements, quotation locking and line-item edits.
2. **Server Actions / route handlers** re-verify the user with Supabase Auth (`getUser()`, not just the cookie) and check the role (`src/lib/auth.ts`, `src/lib/admin/action.ts`) before every privileged mutation, and validate input with Zod.
3. **UI** hides actions the user can't take (convenience only).

`src/proxy.ts` only refreshes sessions and redirects; it is not relied on for authorization.

### Public forms
- Server-side Zod validation; prices/status never accepted from the browser.
- Honeypot field + minimum fill time; per-visitor rate limiting (salted HMAC of IP+UA, raw IPs never stored).
- Idempotency key per form render prevents double submissions.
- Written with the service key only after validation; `upsert_customer` and the rate-limit function are not executable by `anon`/`authenticated`.

### Secrets
- `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RATE_LIMIT_SALT` are read only in `server-only` modules. Importing them from a client component fails the build.
- Email errors are sanitised before logging/storing (API keys are masked).

### Uploads
- Staff-only Server Action; size ≤ 5 MB; type detected from file bytes (JPEG/PNG/WebP/AVIF); SVG/HTML rejected; server-generated paths (`folder/yyyy/mm/uuid.ext`); bucket MIME/size limits as a second check.

### Other protections
- Security headers (HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy); `noindex` + `no-store` on `/admin`.
- External links are rendered only if they are `http(s)` URLs; JSON-LD is escaped; owner-edited page text is rendered as text, never HTML.
- CSV exports neutralise spreadsheet formula injection and are logged in the audit history.
- Booking confirmation pages never look up data from the URL (no reference enumeration).
- Audit log is append-only from the app (`update`/`delete` revoked).

## Production checklist

- [ ] Supabase *Allow new users to sign up* is **off**; site URL and redirect URLs set; custom SMTP configured.
- [ ] Only migrations + `seed.sql` applied (not `seed-dev.sql`). No sample vehicles/tours remain.
- [ ] Supabase *Advisors* show no security warnings; RLS enabled on all `public` tables.
- [ ] Owner account created with `--invite`; owner enabled MFA if available; no shared logins.
- [ ] Secret key, Resend key and rate-limit salt set as **Sensitive** in Vercel; not present in the repo (`git grep -n "sb_secret\|re_"` returns nothing).
- [ ] `NEXT_PUBLIC_SITE_URL` is the canonical https domain.
- [ ] Resend domain verified; a test request shows **sent** in Email deliveries.
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` pass in CI.
- [ ] Database tests (`npm run test:db`) pass against a local copy of the production schema.
- [ ] Legal pages reviewed; business address/licence only published if real and verified.
- [ ] Backups/PITR configured and a restore tested.
- [ ] Team members have the least role they need; former staff deactivated in Admin → Team.
- [ ] Periodically review Admin → Audit history and Email deliveries.
