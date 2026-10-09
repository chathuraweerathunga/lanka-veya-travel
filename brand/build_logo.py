"""Builds the Lanka Veya Travel logo set as pure-vector SVGs (text converted to paths)."""
import io, sys, os
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT, OUT = sys.argv[1], sys.argv[2]
TEAL, TEAL_DEEP, GOLD, IVORY, WHITE = "#123f3d", "#0b2726", "#c7ae7b", "#f7f4ec", "#ffffff"

def load(name, axes):
    f = instantiateVariableFont(TTFont(f"{ROOT}/src/app/fonts/{name}.woff2"), axes)
    f.flavor = None
    b = io.BytesIO(); f.save(b); data = b.getvalue()
    return TTFont(io.BytesIO(data)), data

SERIF = load("fraunces-latin-opsz-normal", {"opsz": 72, "wght": 420})
SANS = load("figtree-latin-wght-normal", {"wght": 600})

def text(font, txt, size, x, y, tracking=0.0):
    """Returns (svg path d, width) for txt with its baseline at y, starting at x. tracking in em."""
    tt, data = font
    hbfont = hb.Font(hb.Face(data)); buf = hb.Buffer(); buf.add_str(txt); buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": True})
    upm = tt["head"].unitsPerEm; s = size / upm; gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    cx = 0.0; n = len(buf.glyph_infos)
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        gs[order[info.codepoint]].draw(TransformPen(pen, (s, 0, 0, -s, x + (cx + pos.x_offset) * s, y - pos.y_offset * s)))
        cx += pos.x_advance + (tracking * upm if i < n - 1 else 0)
    return pen.getCommands(), cx * s

def cap_height(font, size):
    tt, _ = font; bp = BoundsPen(tt.getGlyphSet()); tt.getGlyphSet()["H"].draw(bp)
    return bp.bounds[3] * size / tt["head"].unitsPerEm

# Mark, drawn in a 100 x 150 box: island/tea-leaf cut by a winding road, with a rising sun.
ISLAND = "M42 4C49 20 70 42 81 66C93 92 88 122 66 137C46 150 19 141 12 116C6 94 15 72 25 52C32 37 38 22 42 4Z"
ROAD = "M30 150C40 120 72 112 60 84C50 60 30 50 44 0"

def mark(uid, x, y, h, island, sun, road_w=5.2):
    k = h / 150
    return (f'<g transform="translate({x:.2f} {y:.2f}) scale({k:.4f})">'
            f'<mask id="road-{uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="150">'
            f'<rect width="100" height="150" fill="#fff"/><path d="{ROAD}" fill="none" stroke="#000" stroke-width="{road_w}"/></mask>'
            f'<path d="{ISLAND}" fill="{island}" mask="url(#road-{uid})"/>'
            f'<circle cx="78" cy="25" r="8.5" fill="{sun}"/></g>')

def svg(w, h, body, bg=None, title="Lanka Veya Travel"):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{rect}{body}</svg>\n')

def horizontal(fg, sub, island, sun, bg=None, uid="h"):
    pad, mh = 24, 150
    mw = mh * 100 / 150
    name_size, sub_size = 76, 19
    tx = pad + mw + 30
    ch = cap_height(SERIF, name_size)
    name_base = pad + mh * 0.52
    d1, w1 = text(SERIF, "Lanka Veya", name_size, tx, name_base, -0.01)
    sub_base = name_base + 22 + cap_height(SANS, sub_size)
    d2, w2 = text(SANS, "TRAVEL", sub_size, tx + 3, sub_base, 0.42)
    rule_y = sub_base - cap_height(SANS, sub_size) / 2
    rx = tx + 3 + w2 + 14
    W = tx + max(w1, w2 + 3) + pad
    rule = f'<rect x="{rx:.2f}" y="{rule_y - 0.75:.2f}" width="{max(tx + w1 - rx, 0):.2f}" height="1.5" fill="{sub}"/>'
    body = mark(uid, pad, pad, mh, island, sun) + f'<path d="{d1}" fill="{fg}"/><path d="{d2}" fill="{sub}"/>' + rule
    return svg(W, pad * 2 + mh, body, bg)

def stacked(fg, sub, island, sun, bg=None, uid="s"):
    pad, mh = 40, 170
    name_size, sub_size = 72, 18
    _, w1 = text(SERIF, "Lanka Veya", name_size, 0, 0, -0.01)
    _, w2 = text(SANS, "TRAVEL", sub_size, 0, 0, 0.42)
    W = max(w1, w2 + 120) + pad * 2
    mw = mh * 100 / 150
    name_base = pad + mh + 36 + cap_height(SERIF, name_size)
    d1, _ = text(SERIF, "Lanka Veya", name_size, (W - w1) / 2, name_base, -0.01)
    sub_base = name_base + 24 + cap_height(SANS, sub_size)
    d2, _ = text(SANS, "TRAVEL", sub_size, (W - w2) / 2, sub_base, 0.42)
    ry = sub_base - cap_height(SANS, sub_size) / 2 - 0.75
    gap, rl = 18, 44
    rules = (f'<rect x="{(W - w2) / 2 - gap - rl:.2f}" y="{ry:.2f}" width="{rl}" height="1.5" fill="{sub}"/>'
             f'<rect x="{(W + w2) / 2 + gap:.2f}" y="{ry:.2f}" width="{rl}" height="1.5" fill="{sub}"/>')
    body = mark(uid, (W - mw) / 2 + 4, pad, mh, island, sun) + f'<path d="{d1}" fill="{fg}"/><path d="{d2}" fill="{sub}"/>' + rules
    return svg(W, sub_base + pad + 6, body, bg)

def icon(bg, island, sun, size=512, radius=112, uid="i"):
    mh = size * 0.66; mw = mh * 100 / 150
    body = f'<rect width="{size}" height="{size}" rx="{radius}" fill="{bg}"/>' + mark(uid, (size - mw) / 2 + size * 0.01, (size - mh) / 2, mh, island, sun)
    return svg(size, size, body)

def mark_only(island, sun, uid="m"):
    return svg(100 + 8, 150 + 8, mark(uid, 4, 4, 150, island, sun))

files = {
    "lanka-veya-travel-logo.svg": horizontal(TEAL, "#826b3e", TEAL, GOLD),
    "lanka-veya-travel-logo-white.svg": horizontal(WHITE, GOLD, IVORY, GOLD),
    "lanka-veya-travel-logo-stacked.svg": stacked(TEAL, "#826b3e", TEAL, GOLD),
    "lanka-veya-travel-logo-stacked-white.svg": stacked(WHITE, GOLD, IVORY, GOLD),
    "lanka-veya-travel-logo-black.svg": horizontal("#000", "#000", "#000", "#000"),
    "lanka-veya-travel-mark.svg": mark_only(TEAL, GOLD),
    "lanka-veya-travel-mark-white.svg": mark_only(IVORY, GOLD),
    "lanka-veya-travel-icon.svg": icon(TEAL, IVORY, GOLD),
    "lanka-veya-travel-icon-light.svg": icon(IVORY, TEAL, GOLD),
}
os.makedirs(OUT, exist_ok=True)
for name, content in files.items():
    open(f"{OUT}/{name}", "w").write(content)
print("\n".join(files))
