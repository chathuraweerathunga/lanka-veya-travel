"""Builds web-ready variants of the 2026 Lanka Veya Travel logo from the master artwork.

python3 brand/build_logo_2026.py <master.jpg> <repo>
The master is dark green + gold on a white background; this removes the background
(alpha from colour distance, colour un-mixed), and writes light-on-dark variants,
the emblem, a horizontal lockup and square icons.
"""
import sys
import numpy as np
from PIL import Image

src, repo = sys.argv[1], sys.argv[2]
IVORY = np.array([247, 244, 236])
a = np.asarray(Image.open(src).convert("RGB")).astype(float)
bg = np.median(np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3)]), axis=0)
d = np.abs(a - bg).max(2)
alpha = np.clip((d - 8) / 100, 0, 1)
safe = np.maximum(alpha, 1e-3)[..., None]
rgb = np.clip(bg + (a - bg) / safe, 0, 255)
rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
full = Image.fromarray(rgba, "RGBA")

def light(im):
    """Green ink → ivory, gold kept, for dark backgrounds."""
    x = np.asarray(im).astype(float)
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    gold = (r > g * 1.08) & (r > 120)
    out = x.copy()
    out[~gold, :3] = IVORY
    return Image.fromarray(out.astype(np.uint8), "RGBA")

def trim(im, pad=0):
    x0, y0, x1, y1 = im.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    return im.crop((x0 - pad, y0 - pad, x1 + pad, y1 + pad))

# Row bands of the master: emblem, then LANKA / veya / TRAVEL.
H = full.height
alpha_rows = (np.asarray(full.getchannel("A")) > 30).any(1)
runs, start = [], None
for y, on in enumerate(alpha_rows):
    if on and start is None:
        start = y
    if not on and start is not None:
        runs.append((start, y)); start = None
emblem_band, text_top = runs[0], runs[1][0]
emblem = trim(full.crop((0, emblem_band[0], full.width, emblem_band[1])))
text = trim(full.crop((0, text_top, full.width, H)))
full = trim(full, 4)

out = f"{repo}/public/brand"
def save(im, name, width=None):
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(f"{out}/{name}", optimize=True)
    return im

save(full, "logo.png", 900)
save(light(full), "logo-light.png", 900)
save(emblem, "logo-emblem.png", 600)
save(light(emblem), "logo-emblem-light.png", 600)

# Horizontal lockup for the header: emblem at the text block's height, then the words.
eh = text.height
em = emblem.resize((round(emblem.width * eh / emblem.height), eh), Image.LANCZOS)
gap = round(eh * 0.12)
hz = Image.new("RGBA", (em.width + gap + text.width, eh))
hz.alpha_composite(em, (0, 0))
hz.alpha_composite(text, (em.width + gap, 0))
save(hz, "logo-horizontal.png", 1100)
save(light(hz), "logo-horizontal-light.png", 1100)

# Square icons: emblem centred on ivory.
def icon(size, scale=0.78):
    sq = Image.new("RGBA", (size, size), tuple(IVORY) + (255,))
    w = round(size * scale)
    e = emblem.resize((w, round(emblem.height * w / emblem.width)), Image.LANCZOS)
    sq.alpha_composite(e, ((size - e.width) // 2, (size - e.height) // 2))
    return sq.convert("RGB")

icon(512).save(f"{out}/icon-512.png", optimize=True)
icon(192).save(f"{out}/icon-192.png", optimize=True)
icon(512).save(f"{repo}/src/app/icon.png", optimize=True)
icon(180).save(f"{repo}/src/app/apple-icon.png", optimize=True)
sq = Image.new("RGBA", (600, 600), tuple(IVORY) + (255,))
f = full.resize((480, round(full.height * 480 / full.width)), Image.LANCZOS)
sq.alpha_composite(f, ((600 - f.width) // 2, (600 - f.height) // 2))
sq.convert("RGB").save(f"{out}/logo-square.png", optimize=True)
print("emblem", emblem.size, "text", text.size, "horizontal", hz.size, "full", full.size)
