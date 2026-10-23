"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, MessageCircle, RotateCcw, Sparkles, X } from "lucide-react";
import { parseMarkdown, type Inline } from "@/lib/chat/markdown";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; suggestions?: string[] };

const STORE = "lvt-chat-v2";
const SUGGESTIONS = ["Show me your tours", "Airport transfer", "Hire a private driver", "Best time to visit", "How does booking work?"];

function InlineParts({ parts, onNavigate }: { parts: Inline[]; onNavigate: () => void }) {
  return (
    <>
      {parts.map((p, i) =>
        p.type === "text" ? (
          <Fragment key={i}>{p.text}</Fragment>
        ) : p.type === "bold" ? (
          <strong key={i} className="font-semibold">{p.text}</strong>
        ) : p.external ? (
          <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-700 underline underline-offset-2">{p.text}</a>
        ) : (
          <Link key={i} href={p.href} onClick={onNavigate} className="font-medium text-teal-700 underline underline-offset-2">{p.text}</Link>
        ),
      )}
    </>
  );
}

function Rich({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return (
    <div className="space-y-2">
      {parseMarkdown(text).map((b, i) =>
        b.type === "p" ? (
          <p key={i}><InlineParts parts={b.parts} onNavigate={onNavigate} /></p>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.items.map((it, j) => <li key={j}><InlineParts parts={it} onNavigate={onNavigate} /></li>)}
          </ul>
        ),
      )}
    </div>
  );
}

/** Floating chat assistant: answers from the website's own content (see lib/chat/bot.ts) and hands off to WhatsApp or the quote form. */
export function ChatWidget({ name, welcome, whatsappHref }: { name: string; welcome: string; whatsappHref: string | null }) {
  const [open, setOpen] = useState(false);
  // Restored from this tab's session; the panel starts closed, so server and client markup still match.
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      return typeof window === "undefined" ? [] : ((JSON.parse(sessionStorage.getItem(STORE) ?? "[]") as Msg[]) ?? []);
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-30)));
    } catch {}
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const content = text.trim().slice(0, 1000);
    if (!content || busy) return;
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const help = whatsappHref ? `[message us on WhatsApp](${whatsappHref})` : "[contact us](/contact)";
    try {
      const previous = messages.filter((m) => m.role === "user").map((m) => m.content).slice(-5);
      const [res] = await Promise.all([
        fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: content, previous }) }),
        new Promise((r) => setTimeout(r, 450)), // a short, natural "typing" pause
      ]);
      const data = (await res.json().catch(() => ({}))) as { reply?: string; suggestions?: string[]; error?: string };
      const reply = data.reply ?? `${data.error ?? "Sorry, I couldn't connect just now."} Please try again, or ${help}.`;
      setMessages([...history, { role: "assistant", content: reply, suggestions: data.suggestions ?? [] }]);
    } catch {
      setMessages([...history, { role: "assistant", content: `Sorry, I couldn't connect just now. Please try again, or ${help}.` }]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="lvt-chat"
        className={cn(
          "fixed bottom-20 right-4 z-30 inline-flex size-13 items-center justify-center gap-2 rounded-full bg-teal-900 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(11,39,38,0.55)] transition-transform hover:-translate-y-0.5 sm:bottom-20 sm:right-5 sm:h-12 sm:w-auto sm:pl-4 sm:pr-5 print:hidden",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-5" aria-hidden /> : <Sparkles className="size-5 text-champagne" aria-hidden />}
        <span className="sr-only sm:not-sr-only">{open ? "Close chat" : `Ask ${name}`}</span>
      </button>

      {open ? (
        <section
          id="lvt-chat"
          role="dialog"
          aria-label={`Chat with ${name}`}
          className="fixed inset-x-0 bottom-0 z-40 flex h-[88dvh] flex-col overflow-hidden rounded-t-2xl border border-line bg-white shadow-[0_24px_60px_-20px_rgba(11,39,38,0.45)] sm:inset-x-auto sm:bottom-36 sm:right-5 sm:h-[min(36rem,calc(100dvh-11rem))] sm:w-[24rem] sm:rounded-2xl print:hidden"
        >
          <header className="on-dark flex items-center gap-3 bg-teal-950 px-4 py-3 text-white">
            <span className="grid size-9 place-items-center rounded-full bg-white/10"><Sparkles className="size-4 text-champagne" aria-hidden /></span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-semibold">{name}</p>
              <p className="text-xs text-white/70">Instant answers, any time</p>
            </div>
            {messages.length ? (
              <button type="button" onClick={() => setMessages([])} className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Start a new chat" title="New chat">
                <RotateCcw className="size-4" aria-hidden />
              </button>
            ) : null}
            <button type="button" onClick={close} className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close chat">
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[0.95rem] leading-relaxed" aria-live="polite">
            <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-ivory px-3.5 py-2.5 text-teal-900">
              <Rich text={welcome} onNavigate={close} />
            </div>
            {messages.length === 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)} className="rounded-full border border-line px-3 py-1.5 text-sm text-teal-900 hover:border-teal-700 hover:bg-teal-50">
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-teal-900 px-3.5 py-2.5 text-white">{m.content}</div>
              ) : (
                <div key={i} className="max-w-[88%] rounded-2xl rounded-tl-sm bg-ivory px-3.5 py-2.5 text-teal-900">
                  {m.content ? <Rich text={m.content} onNavigate={close} /> : <span className="inline-flex gap-1 py-1" aria-label="Typing"><span className="size-1.5 animate-bounce rounded-full bg-teal-700" /><span className="size-1.5 animate-bounce rounded-full bg-teal-700 [animation-delay:120ms]" /><span className="size-1.5 animate-bounce rounded-full bg-teal-700 [animation-delay:240ms]" /></span>}
                </div>
              ),
            )}
            {!busy && messages.at(-1)?.suggestions?.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {messages.at(-1)!.suggestions!.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)} className="rounded-full border border-line px-3 py-1.5 text-sm text-teal-900 hover:border-teal-700 hover:bg-teal-50">
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="border-t border-line p-3">
            <div className="flex items-end gap-2">
              <label htmlFor="lvt-chat-input" className="sr-only">Your message</label>
              <textarea
                id="lvt-chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={1000}
                placeholder="Ask about tours, transfers, drivers…"
                className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-[0.95rem] text-teal-900 outline-none focus:border-teal-700"
              />
              <button type="submit" disabled={busy || !input.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-900 text-white disabled:opacity-40" aria-label="Send">
                <ArrowUp className="size-5" aria-hidden />
              </button>
            </div>
            <p className="mt-2 flex items-center justify-between gap-2 text-[0.72rem] text-muted">
              <span>Automated assistant. For anything personal, our team is on WhatsApp.</span>
              {whatsappHref ? (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 font-medium text-teal-700">
                  <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
                </a>
              ) : null}
            </p>
          </form>
        </section>
      ) : null}
    </>
  );
}
