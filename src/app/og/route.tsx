import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Default 1200×630 share card, used wherever a page has no photo of its own. */
export const dynamic = "force-static";

export async function GET() {
  // Static TTF instances of the brand fonts (Satori can't read variable woff2).
  const dir = join(process.cwd(), "src/app/og");
  const [display, text, logo] = await Promise.all([
    readFile(join(dir, "inter-display-og.ttf")),
    readFile(join(dir, "inter-og.ttf")),
    readFile(join(process.cwd(), "public/brand/logo-light.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0 80px", background: "#0b2726", color: "#ffffff", fontFamily: "Inter" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={400} height={334} alt="" />
        <div style={{ width: 2, height: 300, background: "rgba(199,174,123,0.6)", margin: "0 56px" }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontFamily: "Inter Display", fontSize: 50, lineHeight: 1.12, letterSpacing: -1.5 }}>Private tours, transfers and chauffeur-driven journeys in Sri Lanka.</div>
          <div style={{ marginTop: 26, fontSize: 26, color: "rgba(255,255,255,0.72)" }}>Planned around your dates, pace and interests.</div>
          <div style={{ marginTop: 34, fontSize: 26, color: "#c7ae7b" }}>lankaveyatravel.com</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter Display", data: display, style: "normal", weight: 600 },
        { name: "Inter", data: text, style: "normal", weight: 500 },
      ],
    },
  );
}
