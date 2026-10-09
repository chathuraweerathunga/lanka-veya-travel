import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Owner portal", template: "%s · Owner portal" },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-[#fbfaf7] text-[0.95rem]">{children}</div>;
}
