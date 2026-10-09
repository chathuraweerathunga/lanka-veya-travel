export const PRIMARY_NAV = [
  { href: "/tours", label: "Tours" },
  { href: "/destinations", label: "Destinations" },
  { href: "/transport", label: "Transport" },
  { href: "/airport-transfers", label: "Airport transfers" },
  { href: "/travel-guide", label: "Travel guide" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_NAV = {
  explore: [
    { href: "/tours", label: "Sri Lanka tours" },
    { href: "/destinations", label: "Destinations" },
    { href: "/plan-my-trip", label: "Plan a custom trip" },
    { href: "/travel-guide", label: "Sri Lanka travel guide" },
    { href: "/faq", label: "Questions & answers" },
  ],
  transport: [
    { href: "/airport-transfers", label: "Airport transfers" },
    { href: "/private-driver", label: "Private driver" },
    { href: "/transport", label: "Transfers & day hire" },
    { href: "/vehicles", label: "Vehicles" },
  ],
  company: [
    { href: "/about", label: "About us" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy-policy", label: "Privacy policy" },
    { href: "/terms-and-conditions", label: "Terms & conditions" },
    { href: "/cancellation-policy", label: "Cancellation policy" },
  ],
} as const;
