# Zincer Landing Page — Design Spec

> Date: 2026-10-08 · Status: approved, revised for Astro (rev 2) · Direction: B "Monospace index"

## 1. Purpose

A studio calling card for Zincer, a small software lab that builds developer tools and productivity apps. Success: a visitor (developer, potential collaborator) reads it in under ten seconds and comes away with "these people have taste," and can reach the lab by email or GitHub.

**Out of scope:** product listings (Dono or others), principles/manifesto, newsletter capture, analytics, a theme toggle, OG image. Products will be added in a later iteration. **A blog is out of scope for this iteration, but the structure must make adding one later a content-only change** (see §7).

## 2. Design read

Studio landing page for developers and makers, with a quiet monospace / README-like language, built with Astro (static output, zero client JS) and plain CSS. Taste-skill dials: `DESIGN_VARIANCE 5`, `MOTION_INTENSITY 3`, `VISUAL_DENSITY 2`. Rules drawn from the installed `design-taste-frontend` and `minimalist-ui` skills (`.claude/skills/`).

## 3. Content (final copy)

```
zincer▍
A small software lab. We build developer tools and productivity apps — few of them, carefully.
────────────────
makes     dev tools, productivity apps
since     2026
contact   contact@zincer.com          → mailto:contact@zincer.com
code      github.com/zincer           → https://github.com/zincer/
────────────────
© 2026 Zincer
```

- `zincer` is the page's `<h1>`; the caret is decorative (`aria-hidden="true"`).
- The list is a `<dl>` (`dt` = label, `dd` = value).
- GitHub link opens in the same tab; no `target="_blank"`.

## 4. Layout

- Single viewport (`min-height: 100dvh`), no scroll on desktop or on a 375×667 phone.
- One left-aligned column, `max-width: 34rem`, anchored upper-left: padding `clamp(16px, 9vw, 128px)` inline, `clamp(48px, 12vh, 140px)` top.
- Vertical rhythm: intro sits `1.5rem` below the name; each divider has `2rem` space above and below.
- `<dl>` is a two-column grid: label column `7.5rem` on desktop, `5.5rem` below 480px; row gap `0.35rem`.
- Phone: 16px minimum side gutter; no horizontal overflow at 320px width.

## 5. Visual system

**Typography:** Geist Mono only (SIL OFL), self-hosted as `woff2`, weights 400 and 500, `font-display: swap`, fallback `ui-monospace, "SF Mono", Menlo, monospace`. Body `15px` (`16px` ≥ 1024px), `line-height: 1.75`. Name at weight 500; everything else 400. No other fonts.

**Color tokens** (CSS custom properties on `:root`, swapped under `@media (prefers-color-scheme: dark)`):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FBFBFA` | `#111110` | page background |
| `--text` | `#2F3437` | `#D9D8D4` | body copy, `dd` |
| `--ink` | `#111111` | `#EDECE8` | name, caret, link hover |
| `--muted` | `#6F6E6A` | `#8A8984` | `dt` labels, footer |
| `--rule` | `#EAEAEA` | `#262624` | dividers, link underline |

All text/background pairs must meet WCAG AA (4.5:1). Verified ratios: light — text 12.16, ink 18.24, muted 4.93; dark — text 13.25, ink 15.98, muted 5.39. (The skill's suggested `#787774` was rejected: 4.32:1 on `#FBFBFA` fails AA.) `color-scheme: light dark` is declared so form controls and scrollbars follow.

**Links:** `text-decoration: underline`, `text-decoration-color: var(--rule)`, `text-underline-offset: 0.25em`; on hover/focus the underline becomes `var(--ink)`. Focus: `outline: 2px solid var(--ink); outline-offset: 3px` via `:focus-visible`.

**Banned (per taste skills):** gradients, shadows, cards, icon libraries, emoji, Inter/Roboto, pill containers, "elevate/seamless/unleash" copy.

## 6. Motion

- On load, the name and intro render immediately (no animation, so first paint is the heading); the list and footer fade in with `translateY(8px) → 0`, `opacity 0 → 1`, `600ms cubic-bezier(0.16, 1, 0.3, 1)`, staggered `80ms` and `160ms`. Pure CSS keyframes. (Rev 3: animating the intro from `opacity: 0` prevented Chromium from recording first contentful paint at all.)
- Caret: block `0.6em × 1.1em` in `--ink`, blinks with `steps(1)` on a `1.1s` cycle.
- `@media (prefers-reduced-motion: reduce)`: no fade, no blink; caret solid.
- Only `opacity` and `transform` are animated.

## 7. Architecture & files

Astro (latest stable major) with `output: 'static'`. No UI framework integrations, no islands, so the built HTML contains no `<script>`. Fonts and favicon live in `public/` and are served as-is.

```
landing/
  astro.config.mjs          # static output, no integrations
  package.json              # scripts: dev, build, preview, test
  tsconfig.json             # extends astro/tsconfigs/strict
  public/
    favicon.svg             # mono "z" + caret, adapts to dark mode via embedded media query
    fonts/
      GeistMono-Regular.woff2
      GeistMono-Medium.woff2
      OFL.txt
  src/
    layouts/
      BaseLayout.astro      # <html>, <head> metadata, font preload, global CSS, <slot/>
    styles/
      global.css            # @font-face, tokens, base, links, shared keyframes, reduced motion
    pages/
      index.astro           # the landing content + its scoped layout styles
  tests/
    landing.spec.ts         # Playwright smoke tests (run against `astro preview`)
```

**Why this split:** `BaseLayout` takes `title` and `description` props, so a future `src/pages/blog/*` or content collection reuses the same head, fonts, tokens and dark mode without touching the landing page. Page-specific layout stays scoped inside `index.astro`.

**Head metadata (in `BaseLayout`):** `<html lang="en">`, charset, viewport, `<title>{title}</title>`, meta description, `og:title`, `og:description`, `og:type=website`, `theme-color` for light and dark, `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`, `<link rel="preload">` for both font files. Landing title: `Zincer — a small software lab`; description: the intro sentence.

## 8. Testing & verification

Playwright (`tests/landing.spec.ts`), run against the production build served by `astro preview` (never the dev server, which injects scripts):

1. Page loads with status 200; `h1` text is `zincer`; title matches.
2. Contact link `href` is `mailto:contact@zincer.com`; code link `href` is `https://github.com/zincer/`.
3. At 375×667 and 320×568: `document.documentElement.scrollWidth <= innerWidth` (no horizontal overflow) and content fits without vertical scroll at 375×667.
4. With `colorScheme: 'dark'`, body background computes to `rgb(17, 17, 16)`.
5. With `reducedMotion: 'reduce'`, the caret's `animation-name` is `none`.
6. Both font files return 200 and `document.fonts.check('15px "Geist Mono"')` is true after load.

Manual: Lighthouse accessibility ≥ 95 and performance ≥ 95 (mobile); screenshots at 375 and 1440 wide in light and dark for review.

## 9. Deployment

`npm run build` emits static files to `dist/`; any static host works (Cloudflare Pages, Vercel, GitHub Pages). Choosing and configuring the host is out of scope for this spec.

## 10. Risks

- Geist Mono `woff2` must be obtained from the official Vercel `geist-font` release; if unavailable offline, the fallback stack renders acceptably but the look shifts toward SF Mono.
- "No vertical scroll at 375×667" may fail if copy grows; copy changes should re-run test 3.
