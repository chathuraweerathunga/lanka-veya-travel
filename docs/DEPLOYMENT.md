# Deployment guide

Target: **Vercel** (app) + **Supabase** (database, auth, storage). Nothing in this repository is live until you complete these steps and verify them.

## Current status (9 Oct 2026)

| Step | State |
| --- | --- |
| Supabase project `lanka-veya-travel` (ref `cuhtgqciqkjazubootoq`, Mumbai) | Created |
| Tables, RLS policies on all 26 tables, procedures, `media` bucket, `seed.sql` content | Applied |
| `supabase/finish-setup.sql` (privilege hardening, `save_quotation_draft`, `save_tour`) | Applied |
| Vercel project `lanka-veya-travel` (functions in `bom1`) with public env vars + `RATE_LIMIT_SALT` | Created |
| Vercel ↔ GitHub connection (`main` → Production) | Connected |
| Production live at <https://lankaveyatravel.com> (`NEXT_PUBLIC_SITE_URL` set to it, `ALLOW_INDEXING=true` on Production); `www` 308-redirects to the apex; `lanka-veya-travel.vercel.app` still serves | Live |
| `SUPABASE_SECRET_KEY` in Vercel (Production + Preview, *Sensitive*) | Set |
| Supabase Auth settings (sign-ups off, redirect URLs, templates) | **To do** — see below |
| Resend domain + `RESEND_API_KEY` | **To do** |
| First owner account (lankaveyatravel@gmail.com, active owner) | Created — change the temporary password at `/admin/auth/set-password` after first sign-in |
| Custom domain `lankaveyatravel.com` (registered at Cloudflare; DNS at Cloudflare: `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`, both **DNS only**, grey cloud) | Connected |
| Google Search Console + sitemap `https://lankaveyatravel.com/sitemap.xml` | **To do** |

## 1. Supabase project

1. Create a project at <https://supabase.com/dashboard>. Choose a region near your visitors and team (e.g. *Mumbai, ap-south-1* for Sri Lanka). Note the database password in a password manager.
2. Apply the schema. Either:
   - **CLI (recommended):** `npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push`
   - **SQL editor:** run each file in `supabase/migrations/` in filename order.
3. Load production-safe starter content: run `supabase/seed.sql` in the SQL editor. Then run `supabase/seed-tours.sql` for the starter tour packages (all "price on request"; edit or unpublish them in Admin → Tours). **Do not** run `seed-dev.sql` in production (it contains sample tours and vehicles).
4. Storage: migration `20261009000300_storage.sql` creates the public `media` bucket (5 MB, JPEG/PNG/WebP/AVIF). Confirm it under *Storage*.
5. Check *Database → Advisors* for security/performance warnings and confirm RLS is enabled on every table in `public` (it is in the migrations).

### Auth settings (dashboard → Authentication)

- **Sign In / Providers → Email:** enabled. **Allow new users to sign up: OFF.**
- **URL Configuration:** Site URL `https://lankaveyatravel.com`; Redirect URLs: `https://lankaveyatravel.com/admin/auth/confirm` (add your Vercel preview URL pattern too, e.g. `https://*-<team>.vercel.app/admin/auth/confirm`).
- **Email Templates:** paste `supabase/templates/invite.html` into *Invite user* and `recovery.html` into *Reset password*. They link to `/admin/auth/confirm?token_hash=…`.
- **SMTP:** Supabase's built-in mailer is rate-limited and meant for testing. Configure custom SMTP (Resend provides SMTP credentials) so invitations and resets are delivered reliably.
- **Password policy:** minimum 12 characters; enable leaked-password protection if your plan offers it.

### Keys

*Project Settings → API keys*: copy the **publishable** key (browser-safe) and a **secret** key (server only). Legacy `anon`/`service_role` keys also work.

## 2. Email (Resend)

1. Create an account at <https://resend.com>, add the domain `lankaveyatravel.com` and add the DNS records it shows (SPF, DKIM, optionally DMARC) at your DNS provider. Wait until it shows *Verified*.
2. Create an API key with *sending* access.
3. Set `RESEND_API_KEY` and `EMAIL_FROM="Lanka Veya Travel <bookings@lankaveyatravel.com>"`.
4. In the portal, *Settings → Notifications*, confirm the alert address (defaults to `lankaveyatravel@gmail.com`).
5. Test: submit a request on the site, then check *Admin → Email deliveries* shows **sent**.

Until email is configured, requests are still saved; deliveries show **skipped** with the reason and can be retried.

## 3. Vercel

1. Push this repository to GitHub/GitLab and import it in Vercel (framework preset: Next.js; build command `next build`; Node 22).
2. Environment variables (Production and Preview):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://lankaveyatravel.com` (Preview: leave unset; Vercel URL is used) |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key |
   | `SUPABASE_SECRET_KEY` | secret key — **mark as Sensitive** |
   | `RESEND_API_KEY` | Resend key — Sensitive |
   | `EMAIL_FROM` | verified sender |
   | `RATE_LIMIT_SALT` | `openssl rand -base64 32` — Sensitive |

3. Deploy. Preview deployments are automatically `noindex` (see `src/app/robots.ts`).
4. Create the owner (see README → *Creating the first administrator*) and sign in at `/admin`.

## 4. Domain & DNS (lankaveyatravel.com)

1. Vercel → Project → *Settings → Domains*: add `lankaveyatravel.com` and `www.lankaveyatravel.com`; choose which one redirects to the other.
2. At your registrar/DNS provider set the records Vercel shows (typically `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`, but always use the values Vercel displays).
3. Keep the Resend SPF/DKIM records alongside. If you use Google Workspace or another mailbox for the domain, merge SPF into a single TXT record.
4. HTTPS certificates are issued automatically once DNS resolves.
5. Update Supabase *URL Configuration* and `NEXT_PUBLIC_SITE_URL` if the canonical host differs.

## 5. After going live

- Replace sample imagery with your own licensed photos (portal → Tours/Destinations/Content).
- Add your real vehicles (keep *Show on the website* off until correct), drivers and pricing rules.
- Add real platform links in *Settings*; leave anything you don't have empty (it stays hidden).
- Review the legal pages under *Content → About & legal pages* with a qualified adviser.
- Submit `https://lankaveyatravel.com/sitemap.xml` in Google Search Console.

## 6. Backups & recovery

- Supabase Pro and above includes daily backups; enable **Point-in-Time Recovery** if bookings volume justifies it.
- On any plan, schedule an off-site logical backup, e.g. weekly: `pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner > lvt-$(date +%F).dump`, stored encrypted outside Supabase. Test a restore into a scratch project at least quarterly.
- Storage files (images) are not included in database dumps; keep your original photos, or sync the `media` bucket periodically.
- Portal CSV exports (Reports) are a convenient human-readable snapshot but not a substitute for database backups.

## 7. Updating the schema later

Add a new timestamped file to `supabase/migrations/`, test it locally (`npm run test:db`), then `npx supabase db push`. Never edit migrations that have already run in production.
