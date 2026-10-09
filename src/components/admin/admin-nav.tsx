"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Bell, CalendarCheck, Car, FileText, Globe, History, Inbox, LayoutDashboard, LogOut, Map, Menu,
  Settings, Tags, UserCog, Users, UserRound, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/site/wordmark";

type Item = { href: string; label: string; icon: keyof typeof ICONS; minRole?: "admin" | "owner" };
const ICONS = { LayoutDashboard, CalendarCheck, Inbox, Users, Map, Globe, Car, UserRound, Tags, FileText, Settings, BarChart3, History, Bell, UserCog };

export const ADMIN_NAV: { group: string; items: Item[] }[] = [
  {
    group: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
      { href: "/admin/bookings", label: "Bookings", icon: "CalendarCheck" },
      { href: "/admin/inquiries", label: "Trip requests & messages", icon: "Inbox" },
      { href: "/admin/customers", label: "Customers", icon: "Users" },
    ],
  },
  {
    group: "Fleet",
    items: [
      { href: "/admin/vehicles", label: "Vehicles", icon: "Car" },
      { href: "/admin/drivers", label: "Drivers", icon: "UserRound" },
      { href: "/admin/pricing", label: "Pricing rules", icon: "Tags" },
    ],
  },
  {
    group: "Website",
    items: [
      { href: "/admin/tours", label: "Tours", icon: "Map" },
      { href: "/admin/destinations", label: "Destinations", icon: "Globe" },
      { href: "/admin/content", label: "Content & FAQs", icon: "FileText" },
      { href: "/admin/settings", label: "Settings & links", icon: "Settings", minRole: "admin" },
    ],
  },
  {
    group: "Records",
    items: [
      { href: "/admin/reports", label: "Reports & exports", icon: "BarChart3" },
      { href: "/admin/notifications", label: "Email deliveries", icon: "Bell" },
      { href: "/admin/audit", label: "Audit history", icon: "History", minRole: "admin" },
      { href: "/admin/team", label: "Team", icon: "UserCog", minRole: "owner" },
    ],
  },
];

const RANK = { staff: 1, admin: 2, owner: 3 } as const;

export function AdminNav({ role, name, signOut }: { role: "owner" | "admin" | "staff"; name: string; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  const nav = (
    <nav aria-label="Owner portal" className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5 text-white">
        <LogoMark className="h-8 text-white" />
        <span className="leading-tight">
          <span className="block font-display text-lg">Lanka Veya</span>
          <span className="block text-xs text-white/60">Owner portal</span>
        </span>
      </Link>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {ADMIN_NAV.map((g) => {
          const items = g.items.filter((i) => !i.minRole || RANK[role] >= RANK[i.minRole]);
          if (!items.length) return null;
          return (
            <div key={g.group}>
              <p className="px-2 pb-1.5 text-xs text-white/45">{g.group}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = ICONS[item.icon];
                  const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                          active ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/6 hover:text-white",
                        )}
                      >
                        <Icon className={cn("size-4", active ? "text-champagne" : "")} aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-sm">
        <p className="truncate text-white">{name}</p>
        <p className="text-xs capitalize text-white/55">{role}</p>
        <div className="mt-3 flex gap-4">
          <Link href="/" className="text-white/70 hover:text-white">View website</Link>
          <form action={signOut}>
            <button type="submit" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white">
              <LogOut className="size-3.5" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="on-dark fixed inset-y-0 left-0 z-30 hidden w-64 bg-teal-950 lg:block">{nav}</aside>
      <div className="on-dark sticky top-0 z-30 flex h-14 items-center justify-between bg-teal-950 px-4 text-white lg:hidden">
        <Link href="/admin" className="flex items-center gap-2"><LogoMark className="h-7 text-white" /> <span className="font-display">Lanka Veya</span></Link>
        <button type="button" aria-expanded={open} aria-controls="admin-mobile-nav" onClick={() => setOpenedOn(open ? null : pathname)} className="inline-flex size-10 items-center justify-center">
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>
      {open ? (
        <div id="admin-mobile-nav" className="on-dark fixed inset-0 top-14 z-30 bg-teal-950 lg:hidden">
          {nav}
        </div>
      ) : null}
    </>
  );
}
