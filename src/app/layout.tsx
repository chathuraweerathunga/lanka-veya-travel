import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

// Self-hosted (SIL Open Font License, see ./fonts) — no third-party font requests.
const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces-latin-opsz-normal.woff2", style: "normal", weight: "100 900" },
    { path: "./fonts/fraunces-latin-opsz-italic.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

const figtree = localFont({
  src: [{ path: "./fonts/figtree-latin-wght-normal.woff2", style: "normal", weight: "300 900" }],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Lanka Veya Travel — Sri Lanka private tours & transfers",
    template: "%s | Lanka Veya Travel",
  },
  applicationName: "Lanka Veya Travel",
};

export const viewport: Viewport = {
  themeColor: "#123f3d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${figtree.variable} antialiased`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
