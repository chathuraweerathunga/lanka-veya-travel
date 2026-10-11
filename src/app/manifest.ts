import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lanka Veya Travel",
    short_name: "Lanka Veya",
    description: "Private tours, airport transfers and chauffeur-driven journeys across Sri Lanka.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b2726",
    theme_color: "#123f3d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
