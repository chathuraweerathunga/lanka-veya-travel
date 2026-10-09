-- Hardening from the Supabase security advisor.

-- Fixed search_path on the generic updated_at trigger.
alter function public.set_updated_at() set search_path = '';

-- Trigger functions are never called directly; remove them from the RPC API.
-- (Postgres does not check EXECUTE when a trigger fires.)
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_privileges() from public, anon, authenticated;
revoke execute on function public.log_booking_status() from public, anon, authenticated;

-- Not used by policies or the app for anonymous visitors.
revoke execute on function public.current_app_role() from public, anon;

-- Intentionally left executable: is_staff(), is_admin(), is_owner().
-- The public read policies call them (e.g. `status = 'published' or is_staff()`),
-- so anon needs EXECUTE; they only report the caller's own access level.
-- form_attempts intentionally has RLS with no policies (service role only).
