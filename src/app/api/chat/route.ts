import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getPublicSettings } from "@/lib/data/settings";
import { getKnowledge } from "@/lib/chat/knowledge";
import { assistantInstructions } from "@/lib/chat/instructions";
import { allowChatRequest } from "@/lib/chat/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(30)
    .refine((m) => m[0].role === "user" && m[m.length - 1].role === "user", "Conversation must start and end with a visitor message."),
});

const plain = (text: string, status: number) => new Response(text, { status, headers: { "content-type": "text/plain; charset=utf-8" } });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return plain("The chat assistant isn't set up yet.", 503);

  // Only the website itself may call this endpoint.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return plain("Forbidden", 403);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowChatRequest(ip)) return plain("You're sending messages quickly. Please wait a few minutes, or message us on WhatsApp.", 429);

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return plain("Invalid request.", 400);

  const settings = await getPublicSettings();
  if (!settings.assistant.enabled) return plain("The chat assistant is turned off.", 403);

  const system = `${assistantInstructions(settings.assistant.name || "Veya", settings.business)}\n\n<business_information>\n${await getKnowledge()}\n</business_information>`;
  const fallbackNote = settings.business.whatsapp_display
    ? `\n\nSorry, I couldn't finish that answer. Please message the team on WhatsApp at ${settings.business.whatsapp_display} and they'll be happy to help.`
    : "\n\nSorry, I couldn't finish that answer. Please use the [contact page](/contact) and the team will be happy to help.";

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = client.beta.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 4096,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "low" },
          system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
          messages: parsed.data.messages,
        });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(encoder.encode(fallbackNote));
      } catch (error) {
        if (error instanceof Anthropic.RateLimitError) console.error("[chat] rate limited by the API");
        else if (error instanceof Anthropic.APIError) console.error(`[chat] API error ${error.status}: ${error.message}`);
        else console.error("[chat] stream failed:", error);
        controller.enqueue(encoder.encode(fallbackNote));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
