# Vectron Technologies — Website

Static marketing site for [vectrontechnologies.com](https://vectrontechnologies.com). Built with Astro 5 + Tailwind 4, deployed to GitHub Pages.

---

## Quick start

```bash
# one-time
brew install node          # if needed (requires Node ≥ 20)
npm install
cp .env.example .env       # then fill in PUBLIC_FORMSPREE_ID

# dev
npm run dev                # http://localhost:4321

# build
npm run build
npm run preview            # preview the production build locally
```

---

## Project layout

```
src/
├── components/    Reusable UI (Header, Footer, Hero, ContactForm, ...)
├── layouts/       BaseLayout.astro — SEO, fonts, header/footer shell
├── pages/         File-based routes
│   ├── index.astro
│   ├── contact.astro
│   └── services/
│       ├── ai-automation-for-engineering-firms.astro
│       ├── ai-automation-for-sales-agencies.astro
│       └── rf-electromagnetics.astro
└── styles/global.css   Tailwind import + design tokens + chrome utilities

public/
├── CNAME                         vectrontechnologies.com — do not delete
├── favicon.svg
├── brand/vectron-letterhead.svg  Source letterhead art
├── images/generated/*.svg        Branded placeholders (shipped)
└── images/generated/*.png        Gemini-generated visuals (after gen:images)

scripts/generate-images.ts        One-shot image generator (local only)
.github/workflows/deploy.yml      Build + deploy to GitHub Pages
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Var | Where it's used |
|---|---|
| `PUBLIC_FORMSPREE_ID` | Client-side contact form. Get at [formspree.io](https://formspree.io). Form submissions forward to your Workspace inbox. |
| `GEMINI_API_KEY` | Local-only. Used by `npm run gen:images`. Never needed at build time. |
| `GEMINI_IMAGE_MODEL` | Optional. Defaults to `gemini-3-pro-image-preview` (Nano Banana 2). Set to `gemini-2.5-flash-image-preview` for the original Nano Banana. |

For production deployment, add `PUBLIC_FORMSPREE_ID` as a GitHub Actions secret (Settings → Secrets → Actions).

---

## Generating hero images with Gemini (Nano Banana 2)

The site ships with SVG placeholder hero images so it looks polished out of the box. To swap in real AI-generated visuals:

```bash
export GEMINI_API_KEY=<your key>
npm run gen:images                    # regenerates all
npm run gen:images home-hero rf-hero  # regenerates specific slugs
```

This writes PNGs to `public/images/generated/<slug>.png`. Then update the four hero image references in `src/pages/` from `.svg` to `.png`:

```bash
# macOS
find src/pages -name "*.astro" -exec sed -i '' \
  -e 's|/images/generated/\([a-z-]*\)\.svg|/images/generated/\1.png|g' {} +
```

(Also update the matching `ogImage` props and `BaseLayout.astro`'s default.) Commit both the PNGs and the updated paths.

Prompts live in `scripts/generate-images.ts` and share a style suffix so visuals stay coherent — edit there to tune the look.

---

## Deployment

### One-time GitHub setup

1. Push this project to a GitHub repo.
2. Repo → Settings → Pages → **Source: GitHub Actions**.
3. Repo → Settings → Secrets and variables → Actions → add `PUBLIC_FORMSPREE_ID`.
4. Push to `main` — the `Deploy` workflow builds and publishes.

### DNS (Google Domains / Workspace DNS admin)

**Do not touch MX records** — they keep Workspace email alive.

Add:

- Apex `@` → four A records:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- `www` → CNAME to `<your-github-username>.github.io.`

After the first deploy: Repo → Settings → Pages → add custom domain `vectrontechnologies.com` and check "Enforce HTTPS" once the cert is issued (usually within minutes).

### Verify

```bash
dig vectrontechnologies.com +short             # should list the four GH IPs
curl -I https://vectrontechnologies.com        # 200 OK, valid cert
```

Send a test submission through the live contact form to confirm delivery to your Workspace inbox.

---

## Design system

- **Palette**: dark obsidian ground (`--color-bg: #050505`), chrome gradients, one teal accent (`--color-accent: #5eead4`).
- **Type**: Space Grotesk (display) + Inter (body), self-hosted.
- **Motifs**: blueprint grid background, chrome gradient on hero headlines, signal-glow rails.

Tokens live in `src/styles/global.css` under `@theme`. The chrome gradient used in the letterhead and in `.chrome-text` is the anchor of the visual identity — don't drift.

---

## Out of scope (for now)

- Analytics — add Plausible or GA4 in a follow-up.
- Blog / CMS — not needed at launch.
- Case study pages — promote "case studies on request" until there are 2+ real ones.
