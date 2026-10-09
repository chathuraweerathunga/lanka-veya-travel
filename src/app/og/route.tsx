import { ImageResponse } from "next/og";

/** Default 1200×630 share card, used wherever a page has no photo of its own. */
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#0d2a29", color: "#ffffff" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -1 }}>Lanka Veya Travel</div>
          <div style={{ marginTop: 8, fontSize: 30, letterSpacing: 8, color: "#cfb27c" }}>SRI LANKA</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: 120, height: 6, background: "#cfb27c", marginBottom: 36 }} />
          <div style={{ fontSize: 54, lineHeight: 1.15, maxWidth: 980 }}>Private tours, airport transfers and chauffeur-driven journeys.</div>
          <div style={{ marginTop: 24, fontSize: 30, color: "rgba(255,255,255,0.75)" }}>Planned around your dates, pace and interests.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
