import { z } from "zod";
import { getPublicSettings } from "@/lib/data/settings";
import { getBotData } from "@/lib/chat/knowledge";
import { respond } from "@/lib/chat/bot";
import { allowChatRequest } from "@/lib/chat/rate-limit";

export const dynamic = "force-dynamic";

const Body = z.object({
  message: z.string().trim().max(1000),
  previous: z.array(z.string().max(1000)).max(10).default([]),
});

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  // Only the website itself may call this endpoint.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return json({ error: "Forbidden" }, 403);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowChatRequest(ip, 60)) return json({ error: "You're sending messages very quickly. Please wait a few minutes, or message us on WhatsApp." }, 429);

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request." }, 400);

  const settings = await getPublicSettings();
  if (!settings.assistant.enabled) return json({ error: "The chat assistant is turned off." }, 403);

  return json(respond(parsed.data.message, parsed.data.previous, await getBotData()));
}
