// Renders the social-media image set into brand/social/ from the logo SVGs.
// Run from the repo root: node brand/build_social.mjs   (needs @playwright/test)
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const L = "brand/logo";
const svg = (name, attrs) => readFileSync(`${L}/${name}.svg`, "utf8").replace(/<title>.*?<\/title>/, "").replace(/width="[\d.]+" height="[\d.]+"/, attrs);
const font = resolve("src/app/fonts/inter-latin-opsz-normal.woff2");
const C = { teal: "#123f3d", deep: "#0b2726", gold: "#c7ae7b", ivory: "#f7f4ec" };
const WEB = "lankaveyatravel.com";
const WA = "+94 77 620 5149";

const base = `
@font-face { font-family: Inter; src: url("file://${font}") format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Inter, sans-serif; -webkit-font-smoothing: antialiased; }
.stage { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.dark { background: radial-gradient(120% 90% at 50% 20%, #17504c 0%, ${C.teal} 45%, ${C.deep} 100%); color: #fff; }
.light { background: radial-gradient(120% 90% at 50% 20%, #ffffff 0%, ${C.ivory} 60%, #ece5d4 100%); color: ${C.teal}; }
.route { position: absolute; fill: none; stroke: ${C.gold}; stroke-linecap: round; stroke-dasharray: 2 14; }
.ring { position: absolute; border-radius: 50%; border: 2px solid ${C.gold}; opacity: .55; }
.eyebrow { font-size: 22px; font-weight: 600; letter-spacing: .32em; text-transform: uppercase; color: ${C.gold}; }
.tag { font-weight: 300; letter-spacing: -0.02em; }
`;
const route = (style, d) => `<svg class="route" style="${style}" viewBox="0 0 200 400"><path d="${d ?? "M150 0c-60 60 40 110-20 170S20 260 80 320s60 60 40 80"}" stroke-width="2.4"/></svg>`;

const jobs = [
  // Profile pictures: logo + name inside the circle-safe area (platforms crop to a circle).
  { file: "profile-teal.png", w: 1080, h: 1080, html: `<div class="stage dark" style="width:1080px;height:1080px">
      <div class="ring" style="width:960px;height:960px;left:60px;top:60px"></div>
      ${svg("lanka-veya-travel-logo-stacked-white", 'width="640"')}</div>` },
  { file: "profile-ivory.png", w: 1080, h: 1080, html: `<div class="stage light" style="width:1080px;height:1080px">
      <div class="ring" style="width:960px;height:960px;left:60px;top:60px"></div>
      ${svg("lanka-veya-travel-logo-stacked", 'width="640"')}</div>` },
  // Symbol only, for very small avatars (favicons, app icons, Google Maps).
  { file: "profile-symbol-teal.png", w: 1080, h: 1080, html: `<div class="stage dark" style="width:1080px;height:1080px">
      <div class="ring" style="width:960px;height:960px;left:60px;top:60px"></div>
      ${svg("lanka-veya-travel-mark-white", 'height="560"')}</div>` },
  // Facebook cover (1640×624). Desktop crops the sides and the profile picture overlaps the bottom-left, so content stays centre-right.
  { file: "facebook-cover.png", w: 1640, h: 624, html: `<div class="stage dark" style="width:1640px;height:624px;justify-content:flex-start;padding-left:560px">
      ${route("height:760px;right:-40px;top:-80px;opacity:.55")}
      <div style="position:absolute;right:120px;top:50%;transform:translateY(-50%);opacity:.07">${svg("lanka-veya-travel-mark-white", 'height="520"')}</div>
      <div style="display:flex;flex-direction:column;gap:26px">
        ${svg("lanka-veya-travel-logo-white", 'width="560"')}
        <div class="tag" style="font-size:40px;line-height:1.2;max-width:820px;padding-left:24px">Private tours, airport transfers and<br/>chauffeur-driven journeys across Sri Lanka.</div>
        <div class="eyebrow" style="padding-left:26px">${WEB}</div>
      </div></div>` },
  // Wide banner (1500×500), e.g. X, LinkedIn, YouTube art.
  { file: "banner-wide.png", w: 1500, h: 500, html: `<div class="stage dark" style="width:1500px;height:500px;gap:80px">
      ${route("height:640px;left:-30px;top:-70px;opacity:.5")}
      ${route("height:640px;right:-30px;top:-70px;opacity:.5;transform:scaleX(-1)")}
      ${svg("lanka-veya-travel-logo-white", 'width="520"')}
      <div style="width:2px;height:180px;background:${C.gold};opacity:.6"></div>
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="tag" style="font-size:46px;line-height:1.1">Discover Sri Lanka.<br/><span style="color:${C.gold}">Travel Your Way.</span></div>
        <div class="eyebrow" style="font-size:18px">${WEB}</div>
      </div></div>` },
  // WhatsApp Status / Instagram & Facebook Story (1080×1920).
  { file: "story-status.png", w: 1080, h: 1920, html: `<div class="stage dark" style="width:1080px;height:1920px;flex-direction:column;gap:90px">
      ${route("height:900px;right:-140px;top:-120px;opacity:.28")}
      ${route("height:900px;left:-140px;bottom:-140px;opacity:.2;transform:scale(-1,-1)")}
      ${svg("lanka-veya-travel-logo-stacked-white", 'width="660"')}
      <div class="tag" style="font-size:76px;line-height:1.08;text-align:center">Discover Sri Lanka.<br/><span style="color:${C.gold}">Travel Your Way.</span></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:22px">
        <div style="font-size:34px;font-weight:300;opacity:.85;text-align:center">Private tours · Airport transfers · Chauffeur drives</div>
        <div style="margin-top:30px;padding:26px 54px;border-radius:999px;background:${C.gold};color:${C.deep};font-size:38px;font-weight:600;letter-spacing:-0.01em">WhatsApp ${WA}</div>
        <div class="eyebrow" style="font-size:26px;margin-top:14px">${WEB}</div>
      </div></div>` },
];

const b = await chromium.launch();
for (const j of jobs) {
  const p = await b.newPage({ viewport: { width: j.w, height: j.h } });
  await p.setContent(`<!doctype html><html><head><style>${base}</style></head><body>${j.html}</body></html>`, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `brand/social/${j.file}`, clip: { x: 0, y: 0, width: j.w, height: j.h } });
  await p.close();
  console.log("brand/social/" + j.file);
}
// Circle-crop preview of the profile pictures, as WhatsApp/Instagram show them.
const p = await b.newPage({ viewport: { width: 1400, height: 520 } });
const img = (f) => `data:image/png;base64,${readFileSync(`brand/social/${f}`).toString("base64")}`;
await p.setContent(`<html><body style="margin:0;height:520px;display:flex;gap:60px;align-items:center;justify-content:center;background:#e9ece9">
  ${["profile-teal.png", "profile-ivory.png", "profile-symbol-teal.png"].map((f) => `<img src="${img(f)}" style="width:360px;height:360px;border-radius:50%;box-shadow:0 10px 30px rgba(0,0,0,.18)">`).join("")}
  <div style="display:flex;flex-direction:column;gap:18px">${["profile-teal.png", "profile-ivory.png"].map((f) => `<img src="${img(f)}" style="width:64px;height:64px;border-radius:50%">`).join("")}</div>
</body></html>`);
await p.screenshot({ path: "brand/social/preview-circle-crop.png" });
await b.close();
