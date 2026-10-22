/**
 * Best-effort, in-memory rate limit for the chat endpoint (per server instance).
 * It stops a single visitor from running up the AI bill; it is not a security boundary.
 */
const hits = new Map<string, number[]>();

export function allowChatRequest(key: string, limit = 20, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return true;
}
