import Script from "next/script";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { WhatsAppFloat } from "@/components/site/whatsapp-float";
import { getPublicSettings } from "@/lib/data/settings";
import { whatsappLink, whatsappMessages } from "@/lib/whatsapp";

export const revalidate = 300;

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getPublicSettings();
  const wa = whatsappLink(settings.business.whatsapp, whatsappMessages.general());
  const plausible = settings.analytics.plausible_domain?.trim();
  const ga = settings.analytics.ga_measurement_id?.trim();

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-teal-900">
        Skip to content
      </a>
      <SiteHeader whatsappHref={wa} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <WhatsAppFloat href={wa} />
      {plausible && /^[a-z0-9.-]+$/i.test(plausible) ? (
        <Script defer data-domain={plausible} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
      ) : null}
      {ga && /^G-[A-Z0-9]+$/.test(ga) ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}
    </>
  );
}
