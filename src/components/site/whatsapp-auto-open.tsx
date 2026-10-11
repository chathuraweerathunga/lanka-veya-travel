"use client";

import { useEffect, useState } from "react";

/**
 * Opens WhatsApp with the request details once, shortly after the confirmation
 * page loads. Remembered per reference, so a refresh or the back button doesn't
 * open it again; the button on the page always works as the fallback.
 */
export function WhatsappAutoOpen({ href, reference }: { href: string; reference: string }) {
  const [state, setState] = useState<"waiting" | "opened" | "skipped">("waiting");
  useEffect(() => {
    const key = `wa-opened-${reference}`;
    let seen = false;
    try {
      seen = sessionStorage.getItem(key) === "1";
    } catch {}
    if (seen) {
      const t = setTimeout(() => setState("skipped"), 0);
      return () => clearTimeout(t);
    }
    // Marked only when it actually opens, so a cancelled timer (unmount, React
    // re-running the effect) never counts as "already opened".
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(key, "1");
      } catch {}
      setState("opened");
      window.location.href = href;
    }, 1600);
    return () => clearTimeout(t);
  }, [href, reference]);

  if (state === "skipped") return null;
  return (
    <p className="mt-6 flex items-center gap-3 rounded-md bg-[#1f7a4d]/10 px-4 py-3 text-[0.95rem] text-[#1f7a4d]" role="status">
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1f7a4d] opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-[#1f7a4d]" />
      </span>
      {state === "waiting"
        ? "Opening WhatsApp with your request details… just tap Send."
        : "WhatsApp opened. If it didn't, tap the green button below."}
    </p>
  );
}
