# Lanka Veya Travel — logo

The mark is a single shape that reads three ways: the island of Sri Lanka, a tea leaf, and a winding road through it, with a rising sun in champagne gold.

| File | Use |
|---|---|
| `logo/lanka-veya-travel-logo.svg` / `.png` | Primary logo on white or light backgrounds |
| `logo/lanka-veya-travel-logo-white.svg` | On dark or photo backgrounds |
| `logo/lanka-veya-travel-logo-stacked*.svg` | Square-ish spaces: brochures, car stickers, signage |
| `logo/lanka-veya-travel-logo-black.svg` | One-colour printing, stamps, fax |
| `logo/lanka-veya-travel-mark*.svg` | The symbol alone |
| `logo/lanka-veya-travel-icon*.svg` | App icon, favicon, WhatsApp Business profile |
| `logo/png/lanka-veya-travel-social-profile.png` | Facebook, Instagram, Tripadvisor, Google profile picture (1080 × 1080) |

SVGs are pure vector (lettering converted to outlines), so they scale to any size and need no fonts installed. PNGs have transparent backgrounds.

## Colours
| Name | Hex |
|---|---|
| Deep teal (primary) | `#123f3d` |
| Night teal | `#0b2726` |
| Champagne gold | `#c7ae7b` |
| Dark gold (small text on light) | `#826b3e` |
| Ivory | `#f7f4ec` |

## Typefaces
Inter (Inter Display SemiBold for "Lanka Veya", Inter SemiBold for TRAVEL), under the SIL Open Font License; see `src/app/fonts/`.

## Rules
- Keep clear space around the logo at least the width of the sun dot ×2.
- Don't stretch, recolour outside the palette, add shadows or place the teal logo on busy photos (use the white version).
- Minimum size: horizontal logo 120 px / 30 mm wide; icon 16 px.

## Rebuilding
`pip install fonttools brotli uharfbuzz && python3 brand/build_logo.py . brand/logo` regenerates the SVGs.
