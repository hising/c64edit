# C64Edit – C64 Graphics Studio

A modern, UX-first graphics editor for creating demo-scene art for the **Commodore 64**, built with SvelteKit + Svelte 5 + Tailwind CSS v4.

---

## Features

### Graphics Modes
| Mode | Resolution | Colors | Description |
|------|-----------|--------|-------------|
| **Hi-Res Bitmap** | 320×200 | 2/cell | Classic C64 high-resolution bitmap, 2 colors per 8×8 cell |
| **Multicolor Bitmap** | 160×200 | 4/cell | Double-wide pixels, 4 colors per 4×8 cell (Koala format) |
| **Sprite Editor** | 24×21 | 2 | Single-color or multicolor C64 sprite |
| **Charset / Font** | 8×8/char | 2 | Full 256-character font editor |

### Drawing Tools
- **Pencil** (B) — freehand pixel drawing with line interpolation
- **Eraser** (E) — erase pixels
- **Fill** (F) — flood fill
- **Line** (L) — straight line with live preview
- **Rectangle** (R) — outline rectangle with live preview
- **Color Pick** (I) — pick foreground color from canvas

### Editor Features
- 🎨 Full C64 16-color palette with color-picking UI
- ↩️ **Undo / Redo** (Ctrl+Z / Ctrl+Y, up to 50 steps)
- 🔍 **Zoom** 1×–8× with pixel-perfect rendering
- 📐 **Grid overlay** — pixel grid + 8×8 cell grid
- 👁️ **Live preview** panel at 1× or 2× actual size
- 🌈 **Gradient generator** — create C64-compliant color gradients with apply-to-canvas support
- ⌨️ Full **keyboard shortcuts**

### Export Formats
| Format | Extension | Description |
|--------|-----------|-------------|
| **PNG** | `.png` | High-quality export at native or scaled resolution |
| **Koala Painter** | `.kla` | Standard multicolor bitmap (load @ `$6000`) |
| **Art Studio / HiRes** | `.art` | Hi-res bitmap (load @ `$2000`) |
| **Assembly hex dump** | `.asm` | ACME-style `!byte` data for direct inclusion in demos |

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| B | Pencil tool |
| E | Eraser tool |
| F | Fill tool |
| L | Line tool |
| R | Rectangle tool |
| I | Color pick |
| G | Toggle grid |
| P | Toggle preview |
| +/- | Zoom in/out |
| 1–8 | Set zoom level |
| [ / ] | Previous/next foreground color |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Ctrl+N | New / clear canvas |
| Delete | Clear canvas |

---

## Development

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
npm run preview    # preview production build
npm run check      # TypeScript + Svelte type check
```

Requires **Node.js 24+**.

---

## C64 Constraints

- **HiRes**: 320×200, 2 colors per 8×8 cell in screen RAM; per-cell palette editing is in progress
- **Multicolor**: 160×200 (double-wide pixels), 4 colors — 1 global background + 3 per cell (screen RAM × 2, color RAM × 1); per-cell RAM editing is in progress
- **Sprites**: 24×21 pixels; Koala export produces correct file layout
- **Charset**: 8×8 per character, 256 definitions; exports as raw binary for CBM font tools
- **Color palette**: faithful reproduction of the canonical C64 VICE/PEPTO palette

---

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) + **Svelte 5** (runes)
- [Tailwind CSS v4](https://tailwindcss.com/) with Vite plugin
- TypeScript (strict mode)
- Pure Canvas 2D API — no heavy dependencies
