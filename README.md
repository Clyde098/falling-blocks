# Falling Blocks — Free Browser Puzzle Game

A complete falling-block puzzle game built with HTML5 Canvas and vanilla JavaScript. No backend, no paid services — deploy for free on GitHub Pages, Netlify, Vercel, or Cloudflare Pages.

## Features

- **10×20 playfield** with SRS rotation and wall kicks
- **7-bag randomizer** for fair piece distribution
- **Ghost piece** showing where the piece will land
- **Hold piece** (C / Shift)
- **Next queue** showing 3 upcoming pieces
- **Soft drop, hard drop, lock delay**
- **Line clears, scoring, levels, increasing speed**
- **Combo and back-to-back scoring**
- **T-spin detection** with bonus scoring
- **Pause, restart, game over**
- **High score** saved in localStorage
- **Sound effects** with mute toggle (Web Audio API)
- **Mobile touch controls** + swipe gestures
- **Reduced motion** and **colorblind-friendly** options
- **PWA / offline support** via Service Worker
- **SEO & Open Graph tags** for nice link previews

## Controls

| Action | Keys |
|--------|------|
| Move left / right | ← / → |
| Soft drop | ↓ |
| Rotate CW | ↑ / X / E |
| Rotate CCW | Z / Q |
| Hard drop | Space |
| Hold | C / Shift |
| Pause | P / Esc |
| Restart | R |

**Mobile:** Swipe left/right to move, swipe down to soft drop, swipe up to hard drop, tap to rotate. On-screen buttons also available.

## Local Run

1. Download all files into a folder.
2. Open `index.html` in your browser.
3. That's it — no build step required.

For Service Worker testing (offline mode), you need a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve