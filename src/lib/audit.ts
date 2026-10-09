import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Appends an entry to the audit log as the signed-in user (RLS enforces actor_id = auth.uid()). */
export async function audit(
  db: SupabaseClient,
  actorId: string,
  entry: { action: string; entityType: string; entityId?: string | null; summary?: string; changes?: unknown },
) {
  const { error } = await db.from("audit_logs").insert({
    actor_id: actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    summary: entry.summary ?? null,
    changes: entry.changes ?? null,
  });
  if (error) console.error("[audit] failed to record", entry.action, error.message);
}
