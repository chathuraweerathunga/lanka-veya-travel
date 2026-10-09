#!/usr/bin/env node
// Creates (or promotes) the first OWNER account. Run once per environment.
//
// Production (recommended — sends an invitation email, no password handled here):
//   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… SITE_URL=https://lankaveyatravel.com \
//     node scripts/bootstrap-admin.mjs --email owner@example.com --name "Owner Name" --invite
//
// Local development only (sets a password you choose, from an env var):
//   BOOTSTRAP_PASSWORD='a-long-local-password' node --env-file=.env.local scripts/bootstrap-admin.mjs --email you@example.com
//
// The service-role key is read from the environment and never printed.
import { createClient } from "@supabase/supabase-js";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true]);
    return acc;
  }, []),
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = String(args.email ?? "").trim().toLowerCase();
const name = typeof args.name === "string" ? args.name : null;
const role = ["owner", "admin", "staff"].includes(args.role) ? args.role : "owner";

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY).");
  process.exit(1);
}
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Pass --email owner@example.com");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUser() {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email);
    if (hit || data.users.length < 200) return hit ?? null;
  }
  return null;
}

let user = await findUser();
if (!user) {
  if (args.invite) {
    const site = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    if (!site) {
      console.error("Set SITE_URL so the invitation link points at your site.");
      process.exit(1);
    }
    const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${site}/admin/auth/confirm?next=/admin/auth/set-password`,
      data: name ? { full_name: name } : undefined,
    });
    if (error) throw error;
    user = data.user;
    console.log(`Invitation sent to ${email}.`);
  } else {
    const password = process.env.BOOTSTRAP_PASSWORD;
    if (!password || password.length < 12) {
      console.error("For a local account set BOOTSTRAP_PASSWORD (12+ chars), or use --invite in production.");
      process.exit(1);
    }
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: name ? { full_name: name } : {} });
    if (error) throw error;
    user = data.user;
    console.log(`Created ${email}.`);
  }
}

// Profile row is created by a database trigger; activate it with the chosen role.
const { error: upErr } = await db.from("profiles").upsert({ id: user.id, email, full_name: name, role, is_active: true }, { onConflict: "id" });
if (upErr) throw upErr;
await db.from("audit_logs").insert({ actor_id: null, action: "team.bootstrap", entity_type: "profile", entity_id: user.id, summary: `${email} set as active ${role} by bootstrap script` });
console.log(`${email} is now an active ${role}.`);
