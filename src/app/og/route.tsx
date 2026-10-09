import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const MARK = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 158" width="108" height="158"><g transform="translate(4 4)"><mask id="road-m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="150"><rect width="100" height="150" fill="#fff"/><path d="M30 150C40 120 72 112 60 84C50 60 30 50 44 0" fill="none" stroke="#000" stroke-width="5.2"/></mask><path d="M42 4C49 20 70 42 81 66C93 92 88 122 66 137C46 150 19 141 12 116C6 94 15 72 25 52C32 37 38 22 42 4Z" fill="#f7f4ec" mask="url(#road-m)"/><circle cx="78" cy="25" r="8.5" fill="#c7ae7b"/></g></svg>`).toString("base64")}`;

/** Default 1200×630 share card, used wherever a page has no photo of its own. */
export const dynamic = "force-static";

export async function GET() {
  // Static TTF instances of the brand fonts (Satori can't read variable woff2).
  const dir = join(process.cwd(), "src/app/og");
  const [serif, sans] = await Promise.all([readFile(join(dir, "fraunces-og.ttf")), readFile(join(dir, "figtree-og.ttf"))]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#0b2726", color: "#ffffff", position: "relative", fontFamily: "Figtree" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK} width={300} height={437} alt="" style={{ position: "absolute", right: 90, top: 96 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Fraunces", fontSize: 84, letterSpacing: -1.5 }}>Lanka Veya</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
            <div style={{ fontSize: 24, letterSpacing: 10, color: "#c7ae7b" }}>TRAVEL</div>
            <div style={{ width: 150, height: 2, background: "#c7ae7b", marginLeft: 14 }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Fraunces", fontSize: 58, lineHeight: 1.12, maxWidth: 720 }}>Private tours, transfers and chauffeur-driven journeys in Sri Lanka.</div>
          <div style={{ marginTop: 24, fontSize: 28, color: "rgba(255,255,255,0.72)" }}>Planned around your dates, pace and interests.</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Fraunces", data: serif, style: "normal", weight: 400 },
        { name: "Figtree", data: sans, style: "normal", weight: 500 },
      ],
    },
  );
}
