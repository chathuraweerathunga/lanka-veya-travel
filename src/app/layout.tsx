import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

// Inter (variable, with optical sizes), self-hosted under the SIL Open Font License (see ./fonts).
// At headline sizes the opsz axis switches to Inter Display automatically.
const inter = localFont({
  src: [
    { path: "./fonts/inter-latin-opsz-normal.woff2", style: "normal", weight: "100 900" },
    { path: "./fonts/inter-latin-opsz-italic.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Lanka Veya Travel — Sri Lanka private tours & transfers",
    template: "%s | Lanka Veya Travel",
  },
  applicationName: "Lanka Veya Travel",
  openGraph: { siteName: "Lanka Veya Travel", locale: "en_GB", type: "website", images: ["/og"] },
  twitter: { card: "summary_large_image" },
  // Google Search Console "HTML tag" verification: set GOOGLE_SITE_VERIFICATION to the content value.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export const viewport: Viewport = {
  themeColor: "#123f3d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Applies the saved or system theme before first paint, so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
