# Vectron Technologies: design system

Applies to the homepage (`public/index.html`, `public/home.css`) and the shared
header and footer (`public/chrome.css`, used by the homepage and the blog).
Brand sources: `Vectron-Brand-Kit` (verified website palette, typography,
logo rules, and the owner-approved gold of 2026-11-07).

## Direction

A technical document, not a marketing page. Sections are numbered and ruled
like a datasheet; content sits on a shared 12-column grid separated by
hairlines instead of floating in rounded cards. Photographs and plots of real
hardware carry the page. The one decorative move is the hero.

## Color

| Token | Value | Role |
|---|---|---|
| `--vx-bg` | `#050505` | Page background |
| `--vx-bg-1` | `#0b0b0b` | Raised sections (alternate with `--vx-bg`) |
| `--vx-line` / `-2` / `-3` | `#1c1c1c` / `#2a2a2a` / `#3d3d3d` | Hairlines, from quietest to strongest |
| `--vx-ink` | `#f4f4f2` | Headings in capitals, primary button |
| `--vx-ink-2` | `#d9d9d9` | Body text |
| `--vx-ink-3` | `#9ca3af` | Secondary body text |
| `--vx-ink-4` | `#8a8a8a` | Labels (5.9:1 on `--vx-bg`) |
| `--vx-teal` | `#5eead4` | Interaction only: links, focus rings, hover, the active nav item, live indicators |
| `--vx-gold` | `#f2bc42` | Data only: section numbers, years, counts, measured values |

Teal and gold never swap roles. If something is gold, it is a number or a
date. If something is teal, it can be clicked or it is live.

The chrome gradient (`.chrome-text`) is reserved for one line of the hero
headline, one line of the AI heading, and one word of the contact heading.

## Type

- **Space Grotesk, capitals only.** Headings, labels, company names, numbers.
  Never set it in sentence case: the lowercase forms read as quirky.
- **Inter for everything in sentence case.** Body, card titles, buttons, nav.
- Labels: Space Grotesk 500, 0.72rem, 0.2em tracking, uppercase.
- Section headings (`.h2`): `clamp(2.1rem, 5.2vw, 4.25rem)`, line-height 0.98.
- Numbers use `font-variant-numeric: tabular-nums`.

## Layout

- Container 1240px, gutter `clamp(1.25rem, 4vw, 2.5rem)`.
- Section rhythm `clamp(4.5rem, 10vw, 8.5rem)` top and bottom, a 1px rule
  between sections, backgrounds alternating `--vx-bg` and `--vx-bg-1`.
- Each section opens with `.sec-idx` (gold number, label, short rule), then
  the heading on columns 1 to 7 and an optional aside on columns 8 to 12.
- Corners are 4px on buttons and 0 on panels and figures.
- Grids are ruled matrices (`.caps`, `.ai-grid`, `.facts`, `.pub-counts`):
  cells share borders, no gaps, no shadows.

## Hero

- Three bands, top to bottom: the aircraft, the text block, the proof rail.
- The B-2 sits top right and never crosses the headline. Its width (`--ac-w`
  in `home.css`) is worked out from the headline size and the screen height,
  so change the headline text or size there, not with one-off offsets. On
  phones and portrait tablets it spans the width above the text.
- Small label: company name, then "Antenna & EM Engineering". Headline: one
  plain sentence saying what the company does, two lines on desktop and four
  on phones.
- One primary button, the same action as the header's.
- **Proof rail** (`.hero-rail`): at most three numbers in gold with a short
  label each. They must match the counts in the publications section.
- The scroll adds about a third of a screen. A stage taller than the screen
  sticks by its bottom edge so the rail is never cut off.

## Components

- **Buttons** (`.vx-btn`): primary is solid `--vx-ink` on black text; ghost is
  a 1px outline. One primary action per section.
- **Spec strip** (`.spec`): label over a gold value. Use only for values that
  appear in the project's own description or its paper.
- **Figures** (`.fig`): photographs fill the frame (`object-fit: cover`);
  plots and diagrams use `.is-contain` so nothing is cropped.
- **Array-factor plot** (`.af`, in `scripts/site.js`): a uniform linear array
  at half-wavelength spacing, computed in the browser. Beamwidth and sidelobe
  level are measured from the computed pattern, not typed in.

## Motion

- Sections fade up 18px once, on first view (`.rv`). Content is visible
  without JavaScript and under `prefers-reduced-motion`.
- The hero flyover is scroll-driven (`scripts/hero-parallax.js`) and falls
  back to a still frame under reduced motion.
- Hero scene (`.hero-scene`, positions as fractions of the landscape frame):
  the B-2 glides in once on load, and tower tops carry slow red obstruction
  lights (the only red on the site, and only inside the photo). Keep hero
  effects this quiet: a radar sweep and hover beam patterns were tried and
  rejected. Off under reduced motion; the lights pause off screen.
- Hover: figures scale to 1.035, arrows shift 2 to 3px. Nothing loops except
  the hero video, the hero scene and the array plot.

## Content rules

- No invented testimonials, client logos, counts or awards. Company names in
  the proof band are employers and programs from the About section, set as
  text, never as logos.
- Defense program work stays described in general terms.
