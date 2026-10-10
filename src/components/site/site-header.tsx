"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark } from "./wordmark";
import { PRIMARY_NAV } from "./nav";

export function SiteHeader({ whatsappHref }: { whatsappHref: string | null }) {
  const pathname = usePathname();
  const overlay = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  // The menu remembers the page it was opened on, so navigating closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenedOn((typeof v === "function" ? v(open) : v) ? pathname : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const transparent = overlay && !scrolled && !open;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-300",
        overlay && "-mb-[76px]",
        transparent ? "bg-transparent on-dark" : "bg-white/90 backdrop-blur-md border-b border-line",
        scrolled && !transparent && "shadow-[0_10px_30px_-20px_rgba(11,39,38,0.35)]",
      )}
    >
      <span className="scroll-progress pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-champagne" aria-hidden />
      <div className="container-page flex h-[76px] items-center justify-between gap-6">
        <Link href="/" aria-label="Lanka Veya Travel home" className="shrink-0">
          <Wordmark tone={transparent ? "light" : "dark"} animated />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[0.94rem]">
            {PRIMARY_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-2 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:transition-transform after:duration-500 after:ease-[var(--ease-out-soft)]",
                      transparent ? "text-white/90 hover:text-white after:bg-champagne" : "text-ink hover:text-teal-700 after:bg-teal-700",
                      active ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "hidden sm:inline-flex items-center gap-2 h-10 px-3 rounded-md text-sm transition-colors",
                transparent ? "text-white hover:bg-white/10" : "text-teal-900 hover:bg-teal-50",
              )}
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          ) : null}
          <Link
            href="/plan-my-trip"
            className={cn(
              "hidden md:inline-flex items-center h-10 px-4 rounded-md text-sm font-medium transition-colors",
              transparent ? "bg-champagne text-teal-950 hover:bg-[#d4bd8e]" : "bg-teal-900 text-white hover:bg-teal-800",
            )}
          >
            Plan your journey
          </Link>
          <button
            type="button"
            className={cn("lg:hidden inline-flex size-10 items-center justify-center rounded-md", transparent ? "text-white" : "text-teal-900")}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      <div id="mobile-menu" hidden={!open} className="lg:hidden border-t border-line bg-white">
        <nav aria-label="Mobile" className="container-page py-6">
          <ul className="space-y-1">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-md px-2 py-3 font-display text-2xl text-teal-900 hover:bg-ivory">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/vehicles" className="block rounded-md px-2 py-3 font-display text-2xl text-teal-900 hover:bg-ivory">
                Vehicles
              </Link>
            </li>
          </ul>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/plan-my-trip" className="inline-flex h-12 items-center justify-center rounded-md bg-teal-900 text-white font-medium">
              Plan your journey
            </Link>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#1f7a4d] text-white font-medium"
              >
                <MessageCircle className="size-4" aria-hidden /> Chat on WhatsApp
              </a>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
