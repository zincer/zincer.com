# Zincer Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a one-screen, monospace "README-style" studio page for Zincer, built with Astro so a blog can be added later without restructuring.

**Architecture:** An Astro static site with no integrations and no islands, so the built HTML ships zero JavaScript. `BaseLayout.astro` owns the `<head>`, fonts, global tokens and dark mode and takes `title`/`description` props; `pages/index.astro` holds the landing content and its scoped layout styles. Playwright tests run against the production build served by `astro preview`.

**Tech Stack:** Astro (latest stable), TypeScript (strict, via Astro's tsconfig), plain CSS, Geist Mono (SIL OFL, from the `geist` npm package), `@playwright/test`, Lighthouse CLI.

**Spec:** `docs/superpowers/specs/2026-10-08-zincer-landing-design.md` (rev 2, Astro). Read it before starting any task.

## Global Constraints

- Working directory for every command: `/Users/daniel.nguyen/Developer/zincer/landing`
- Copy is final and must match exactly: name `zincer`; intro `A small software lab. We build developer tools and productivity apps — few of them, carefully.`; list `makes` → `dev tools, productivity apps`, `since` → `2026`, `contact` → `contact@zincer.com` (`mailto:contact@zincer.com`), `code` → `github.com/zincer` (`https://github.com/zincer/`); footer `© 2026 Zincer`.
- Title: `Zincer — a small software lab`.
- Font: Geist Mono only, weights 400 and 500, `font-display: swap`, fallback `ui-monospace, "SF Mono", Menlo, monospace`.
- Body `15px`, `16px` at ≥1024px, `line-height: 1.75`.
- Color tokens: light `--bg #FBFBFA`, `--text #2F3437`, `--ink #111111`, `--muted #6F6E6A`, `--rule #EAEAEA`; dark `--bg #111110`, `--text #D9D8D4`, `--ink #EDECE8`, `--muted #8A8984`, `--rule #262624`.
- Column `max-width: 34rem`; inline padding `clamp(16px, 9vw, 128px)`; top padding `clamp(48px, 12vh, 140px)`.
- Motion: reveal `600ms cubic-bezier(0.16, 1, 0.3, 1)`, `translateY(8px)`, stagger `80ms`; caret blink `1.1s steps(1)`. Both disabled under `prefers-reduced-motion: reduce`. Animate only `opacity` and `transform`.
- Astro: `output: 'static'`, no integrations, no `client:*` directives, no `<script>` tags. Static assets go in `public/` and are referenced with root-absolute paths (`/fonts/...`, `/favicon.svg`).
- Tests always run against `astro build` + `astro preview`, never `astro dev`, because the dev server injects scripts.
- Banned: gradients, box-shadows, cards, icon libraries, emoji, Inter/Roboto, pill containers, `target="_blank"`.
- Commit messages: `<type>: <description>` (feat, fix, test, chore, docs).

## Review Focus

1. **Narrowest phones (320px)**: the long email and URL must wrap or fit, never cause horizontal scroll → Task 2 test at 320×568.
2. **Short landscape screens (667×375)**: content taller than the viewport must scroll, not be clipped by `100dvh`/`overflow: hidden` → Task 2 test that the footer is reachable.
3. **Fonts blocked or offline**: text must render in the fallback mono immediately, never invisible → Task 2 test with `*.woff2` requests aborted.
4. **Keyboard-only visitors**: Tab must reach the email link, then the GitHub link, with a visible solid focus outline → Task 2 test.
5. **Screen readers**: the decorative caret must not be announced; the heading's accessible name is exactly `zincer` → Task 1 test via `getByRole('heading', { name: 'zincer', exact: true })`.

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | scripts (`dev`, `build`, `preview`, `test`); `astro` dependency; `@playwright/test` dev dependency |
| `astro.config.mjs` | static output, nothing else |
| `tsconfig.json` | extends `astro/tsconfigs/strict` |
| `playwright.config.ts` | test dir, base URL, build + preview web server |
| `.gitignore` | `node_modules/`, `dist/`, `.astro/`, test output, brainstorm files, screenshots |
| `src/layouts/BaseLayout.astro` | `<html>`/`<head>` metadata, font preload, global CSS import, `<slot />`, reusable by future blog pages |
| `src/styles/global.css` | `@font-face`, tokens, dark mode, base, links, shared keyframes |
| `src/pages/index.astro` | landing copy and its scoped layout and motion styles |
| `public/favicon.svg` | mono `z` + caret, light and dark |
| `public/fonts/GeistMono-Regular.woff2`, `public/fonts/GeistMono-Medium.woff2`, `public/fonts/OFL.txt` | self-hosted font + licence |
| `tests/landing.spec.ts` | all Playwright smoke tests |

---

### Task 1: Astro scaffold, test harness, and semantic markup

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `playwright.config.ts`, `.gitignore`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `tests/landing.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `BaseLayout.astro` with `interface Props { title: string; description: string }`. It renders `<slot />` inside `<body>`.
  - Markup hooks in `index.astro`: `.page` wraps everything; `main` holds the content; `.intro`, `.facts` and `footer.foot` are the three reveal groups, each with class `reveal` and inline `style="--i: N"` (N = 0, 1, 2); `h1.name` contains `span.caret[aria-hidden="true"]`; facts are in `.facts dl`.
  - The preview server at `http://127.0.0.1:4173`.

- [ ] **Step 1: Initialise git and install dependencies**

```bash
git init
npm init -y >/dev/null
npm install astro
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Set `package.json` scripts and metadata**

Edit `package.json` so the top-level fields are exactly as below. Keep the `dependencies` and `devDependencies` blocks npm wrote, unchanged.

```json
{
  "name": "zincer-landing",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview --host 127.0.0.1 --port 4173",
    "test": "playwright test"
  }
}
```

Delete any other keys npm generated (`main`, `keywords`, `author`, `license`, `description`, the default `test` script).

- [ ] **Step 3: Create `astro.config.mjs`, `tsconfig.json`, `.gitignore`**

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'static',
})
```

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`.gitignore`:

```gitignore
node_modules/
dist/
.astro/
test-results/
playwright-report/
screenshots/
.superpowers/
.DS_Store
```

- [ ] **Step 4: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: BASE_URL },
  webServer: {
    command: 'npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

- [ ] **Step 5: Write the failing content tests in `tests/landing.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test.describe('content', () => {
  test('loads with title and accessible heading', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle('Zincer — a small software lab')
    await expect(page.getByRole('heading', { level: 1, name: 'zincer', exact: true })).toBeVisible()
  })

  test('caret is hidden from assistive tech', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1 .caret')).toHaveAttribute('aria-hidden', 'true')
  })

  test('intro copy is exact', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.intro p')).toHaveText(
      'A small software lab. We build developer tools and productivity apps — few of them, carefully.'
    )
  })

  test('facts list has the four rows in order', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('dl dt')).toHaveText(['makes', 'since', 'contact', 'code'])
    await expect(page.locator('dl dd')).toHaveText([
      'dev tools, productivity apps',
      '2026',
      'contact@zincer.com',
      'github.com/zincer',
    ])
  })

  test('links point to the real destinations in the same tab', async ({ page }) => {
    await page.goto('/')
    const email = page.getByRole('link', { name: 'contact@zincer.com' })
    const code = page.getByRole('link', { name: 'github.com/zincer' })
    await expect(email).toHaveAttribute('href', 'mailto:contact@zincer.com')
    await expect(code).toHaveAttribute('href', 'https://github.com/zincer/')
    await expect(page.locator('a[target]')).toHaveCount(0)
  })

  test('footer present and zero client scripts', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('footer')).toHaveText('© 2026 Zincer')
    await expect(page.locator('script')).toHaveCount(0)
  })
})
```

- [ ] **Step 6: Run the tests and confirm they fail**

Run: `npx playwright test`
Expected: FAIL. With no `src/pages`, the build produces no index route, so `/` returns 404 and the status assertion fails. (If the build itself errors because `src/pages` is missing, that is also an expected failure.)

- [ ] **Step 7: Create `src/layouts/BaseLayout.astro`**

```astro
---
interface Props {
  title: string
  description: string
}

const { title, description } = Astro.props
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 8: Create `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'

interface Fact {
  label: string
  value: string
  href?: string
}

const title = 'Zincer — a small software lab'
const intro =
  'A small software lab. We build developer tools and productivity apps — few of them, carefully.'

const facts: Fact[] = [
  { label: 'makes', value: 'dev tools, productivity apps' },
  { label: 'since', value: '2026' },
  { label: 'contact', value: 'contact@zincer.com', href: 'mailto:contact@zincer.com' },
  { label: 'code', value: 'github.com/zincer', href: 'https://github.com/zincer/' },
]
---

<BaseLayout title={title} description={intro}>
  <div class="page">
    <main>
      <header class="intro reveal" style="--i: 0">
        <h1 class="name">zincer<span class="caret" aria-hidden="true"></span></h1>
        <p class="lede">{intro}</p>
      </header>

      <section class="facts reveal" style="--i: 1" aria-label="About Zincer">
        <hr class="rule" />
        <dl>
          {
            facts.map(({ label, value, href }) => (
              <>
                <dt>{label}</dt>
                <dd>{href ? <a href={href}>{value}</a> : value}</dd>
              </>
            ))
          }
        </dl>
        <hr class="rule" />
      </section>
    </main>

    <footer class="foot reveal" style="--i: 2">© 2026 Zincer</footer>
  </div>
</BaseLayout>
```

- [ ] **Step 9: Run the tests and confirm they pass**

Run: `npx playwright test`
Expected: 6 passed.

- [ ] **Step 10: Commit**

```bash
git add .gitignore package.json package-lock.json astro.config.mjs tsconfig.json playwright.config.ts src tests docs .claude
git commit -m "feat: scaffold Astro landing with markup and Playwright harness"
```

---

### Task 2: Fonts, tokens, layout, links, and dark mode

**Files:**
- Create: `public/fonts/GeistMono-Regular.woff2`, `public/fonts/GeistMono-Medium.woff2`, `public/fonts/OFL.txt`, `src/styles/global.css`
- Modify: `src/layouts/BaseLayout.astro` (import global CSS; add font preloads), `src/pages/index.astro` (append a scoped `<style>` block)
- Test: `tests/landing.spec.ts` (append)

**Interfaces:**
- Consumes: `BaseLayout` and the class hooks from Task 1.
- Produces: CSS custom properties `--bg --text --ink --muted --rule --font-mono --ease-out --gutter --top --column` on `:root` in `global.css`, which Task 3 uses. The font family name is `"Geist Mono"`.

- [ ] **Step 1: Append the failing layout, theme, font and accessibility tests to `tests/landing.spec.ts`**

```ts
const noHorizontalOverflow = () =>
  document.documentElement.scrollWidth <= window.innerWidth

test.describe('layout', () => {
  test('fits one phone screen at 375x667 with no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    expect(await page.evaluate(noHorizontalOverflow)).toBe(true)
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)
    ).toBe(true)
  })

  test('no horizontal overflow at 320x568', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/')
    expect(await page.evaluate(noHorizontalOverflow)).toBe(true)
  })

  test('short landscape screen scrolls to the footer instead of clipping', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 })
    await page.goto('/')
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()
    await expect(footer).toBeInViewport()
  })

  test('content column is capped at 34rem', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const width = await page.locator('main').evaluate((el) => el.getBoundingClientRect().width)
    expect(width).toBeLessThanOrEqual(34 * 16)
  })
})

test.describe('theme', () => {
  test('light background by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(251, 251, 250)')
  })

  test('dark background under prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(17, 17, 16)')
  })
})

test.describe('fonts', () => {
  test('both Geist Mono weights are served and loaded', async ({ page }) => {
    const fontStatuses: number[] = []
    page.on('response', (r) => {
      if (r.url().endsWith('.woff2')) fontStatuses.push(r.status())
    })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    const loaded = await page.evaluate(() =>
      [...document.fonts]
        .filter((f) => f.family.replace(/"/g, '') === 'Geist Mono' && f.status === 'loaded')
        .map((f) => f.weight)
        .sort()
    )
    expect(loaded).toEqual(['400', '500'])
    expect(fontStatuses.length).toBeGreaterThanOrEqual(2)
    expect(fontStatuses.every((s) => s === 200)).toBe(true)
  })

  test('text still renders when fonts are blocked', async ({ page }) => {
    await page.route('**/*.woff2', (route) => route.abort())
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'zincer', exact: true })).toBeVisible()
    const box = await page.locator('h1').boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(0)
  })
})

test.describe('keyboard', () => {
  test('tab order reaches email then GitHub with a solid outline', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('href', 'mailto:contact@zincer.com')
    await expect(page.locator(':focus')).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveAttribute('href', 'https://github.com/zincer/')
  })
})
```

- [ ] **Step 2: Run the tests and confirm the new ones fail**

Run: `npx playwright test`
Expected: the 6 content tests pass. Most new tests fail; for example, the light background is `rgba(0, 0, 0, 0)` and no fonts load.

- [ ] **Step 3: Fetch Geist Mono from the official `geist` npm package**

```bash
FONT_TMP="$(mktemp -d)"
(cd "$FONT_TMP" && npm pack geist --silent && tar -xzf geist-*.tgz)
find "$FONT_TMP/package" -iname '*mono*.woff2'
find "$FONT_TMP/package" \( -iname 'LICENSE*' -o -iname 'OFL*' \)
```

Expected: the output includes `GeistMono-Regular.woff2` and `GeistMono-Medium.woff2` (usually under `package/dist/fonts/geist-mono/`). Copy them using the paths that `find` printed:

```bash
mkdir -p public/fonts
cp "<path printed for GeistMono-Regular.woff2>" public/fonts/GeistMono-Regular.woff2
cp "<path printed for GeistMono-Medium.woff2>"  public/fonts/GeistMono-Medium.woff2
cp "<path printed for the OFL/LICENSE file>"    public/fonts/OFL.txt
rm -rf "$FONT_TMP"
```

If the package ships **only** a variable font (for example `GeistMono-Variable.woff2`), stop and report back instead of improvising. The spec and tests assume two static weights.

- [ ] **Step 4: Create `src/styles/global.css`**

```css
/* Fonts */
@font-face {
  font-family: "Geist Mono";
  src: url("/fonts/GeistMono-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Geist Mono";
  src: url("/fonts/GeistMono-Medium.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

/* Tokens */
:root {
  color-scheme: light dark;
  --bg: #FBFBFA;
  --text: #2F3437;
  --ink: #111111;
  --muted: #6F6E6A;
  --rule: #EAEAEA;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --gutter: clamp(16px, 9vw, 128px);
  --top: clamp(48px, 12vh, 140px);
  --column: 34rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #111110;
    --text: #D9D8D4;
    --ink: #EDECE8;
    --muted: #8A8984;
    --rule: #262624;
  }
}

/* Base */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  margin: 0;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.75;
  -webkit-font-smoothing: antialiased;
}

@media (min-width: 1024px) {
  body {
    font-size: 16px;
  }
}

/* Links */
a {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: var(--rule);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.25em;
  transition: text-decoration-color 150ms ease;
}

a:hover,
a:focus-visible {
  text-decoration-color: var(--ink);
}

a:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
  border-radius: 2px;
}
```

- [ ] **Step 5: Wire global CSS and font preloads into `BaseLayout.astro`**

In the frontmatter, add as the first line after the opening `---`:

```astro
import '../styles/global.css'
```

In `<head>`, directly after `<meta property="og:type" content="website" />`, add:

```astro
    <link rel="preload" href="/fonts/GeistMono-Regular.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/GeistMono-Medium.woff2" as="font" type="font/woff2" crossorigin />
```

- [ ] **Step 6: Append a scoped `<style>` block to the end of `src/pages/index.astro`**

```astro
<style>
  .page {
    padding: var(--top) var(--gutter);
  }

  .page > * {
    max-width: var(--column);
  }

  .name {
    margin: 0;
    font-size: inherit;
    line-height: inherit;
    font-weight: 500;
    color: var(--ink);
  }

  .lede {
    margin: 1.5rem 0 0;
  }

  .rule {
    margin: 2rem 0;
    border: 0;
    border-top: 1px solid var(--rule);
  }

  .facts dl {
    display: grid;
    grid-template-columns: 7.5rem 1fr;
    row-gap: 0.35rem;
    margin: 0;
  }

  @media (max-width: 479.98px) {
    .facts dl {
      grid-template-columns: 5.5rem 1fr;
    }
  }

  .facts dt {
    color: var(--muted);
  }

  .facts dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .foot {
    color: var(--muted);
  }
</style>
```

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `npx playwright test`
Expected: 15 passed.

- [ ] **Step 8: Commit**

```bash
git add public/fonts src/styles/global.css src/layouts/BaseLayout.astro src/pages/index.astro tests/landing.spec.ts
git commit -m "feat: add Geist Mono, tokens, layout and dark mode"
```

---

### Task 3: Load reveal and caret motion

**Files:**
- Modify: `src/styles/global.css` (append shared keyframes), `src/pages/index.astro` (add caret/reveal rules inside the existing `<style>` block)
- Test: `tests/landing.spec.ts` (append)

**Interfaces:**
- Consumes: `.reveal` with `--i`, `.caret`, `--ink`, `--ease-out` from Tasks 1–2.
- Produces: global keyframes `blink` and `reveal`, which future pages can reuse. They live in `global.css` so scoped-style processing never renames them.

- [ ] **Step 1: Append the failing motion tests**

```ts
test.describe('motion', () => {
  test('caret blinks and groups reveal with stagger', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    const caret = page.locator('.caret')
    await expect(caret).toHaveCSS('animation-name', 'blink')
    await expect(caret).toHaveCSS('animation-duration', '1.1s')
    await expect(page.locator('.facts')).toHaveCSS('animation-name', 'reveal')
    await expect(page.locator('.facts')).toHaveCSS('animation-delay', '0.08s')
    await expect(page.locator('footer')).toHaveCSS('animation-delay', '0.16s')
  })

  test('reduced motion disables all animation and keeps the caret solid', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('.caret')).toHaveCSS('animation-name', 'none')
    await expect(page.locator('.caret')).toHaveCSS('opacity', '1')
    await expect(page.locator('.intro')).toHaveCSS('animation-name', 'none')
    await expect(page.locator('footer')).toHaveCSS('opacity', '1')
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx playwright test -g motion`
Expected: FAIL. `animation-name` is `none` where `blink` is expected.

- [ ] **Step 3: Append the shared keyframes to `src/styles/global.css`**

```css
/* Shared motion */
@keyframes blink {
  50% {
    opacity: 0;
  }
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 4: Add the caret and reveal rules at the end of the `<style>` block in `src/pages/index.astro`, just before `</style>`**

```css
  .caret {
    display: inline-block;
    width: 0.6em;
    height: 1.1em;
    margin-left: 0.15em;
    vertical-align: -0.2em;
    background: var(--ink);
    animation: blink 1.1s steps(1) infinite;
  }

  .reveal {
    animation: reveal 600ms var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * 80ms);
  }

  @media (prefers-reduced-motion: reduce) {
    .caret,
    .reveal {
      animation: none;
    }
  }
```

- [ ] **Step 5: Run the full suite**

Run: `npx playwright test`
Expected: 17 passed. If `animation-delay` reports `0.08s` with float noise (for example `0.0800000s`), change the assertion to read the value and compare with `parseFloat(value) === 0.08`. Do not change the CSS.

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css src/pages/index.astro tests/landing.spec.ts
git commit -m "feat: add load reveal and blinking caret with reduced-motion fallback"
```

---

### Task 4: Favicon and theme-color metadata

**Files:**
- Create: `public/favicon.svg`
- Modify: `src/layouts/BaseLayout.astro` (`<head>`)
- Test: `tests/landing.spec.ts` (append)

**Interfaces:**
- Consumes: the color values from Global Constraints.
- Produces: nothing used by later tasks.

- [ ] **Step 1: Append the failing head-metadata tests**

```ts
test.describe('head', () => {
  test('favicon is linked and served as SVG', async ({ page, request }) => {
    await page.goto('/')
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
    const res = await request.get('/favicon.svg')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('image/svg+xml')
  })

  test('theme-color is set for light and dark', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]')
    ).toHaveAttribute('content', '#FBFBFA')
    await expect(
      page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')
    ).toHaveAttribute('content', '#111110')
  })

  test('description and open graph tags match the intro', async ({ page }) => {
    await page.goto('/')
    const intro =
      'A small software lab. We build developer tools and productivity apps — few of them, carefully.'
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', intro)
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', intro)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Zincer — a small software lab'
    )
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx playwright test -g head`
Expected: the favicon and theme-color tests fail; the description test passes.

- [ ] **Step 3: Create `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    .bg { fill: #FBFBFA; }
    .ink { fill: #111111; }
    @media (prefers-color-scheme: dark) {
      .bg { fill: #111110; }
      .ink { fill: #EDECE8; }
    }
  </style>
  <rect class="bg" width="32" height="32" rx="6"/>
  <text class="ink" x="5" y="22" font-family="ui-monospace, Menlo, monospace" font-size="18" font-weight="500">z</text>
  <rect class="ink" x="18" y="9" width="7" height="15"/>
</svg>
```

- [ ] **Step 4: Add to `BaseLayout.astro`, directly after `<meta property="og:type" content="website" />`**

```astro
    <meta name="theme-color" content="#FBFBFA" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#111110" media="(prefers-color-scheme: dark)" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

- [ ] **Step 5: Run the full suite**

Run: `npx playwright test`
Expected: 20 passed.

- [ ] **Step 6: Commit**

```bash
git add public/favicon.svg src/layouts/BaseLayout.astro tests/landing.spec.ts
git commit -m "feat: add adaptive favicon and theme-color metadata"
```

---

### Task 5: Lighthouse and visual review

**Files:**
- Create (gitignored): `screenshots/*`
- No source changes unless a check fails.

**Interfaces:**
- Consumes: the finished site.
- Produces: scores and screenshots for human review.

- [ ] **Step 1: Build and start the preview server in the background**

Run: `npm run build && npm run preview` (in the background)
Expected: Astro reports the preview server running at `http://127.0.0.1:4173/`.

- [ ] **Step 2: Run Lighthouse in mobile mode**

```bash
mkdir -p screenshots
npx -y lighthouse http://127.0.0.1:4173/ \
  --only-categories=accessibility,performance \
  --form-factor=mobile --quiet \
  --chrome-flags="--headless=new" \
  --output=json --output-path=./screenshots/lighthouse.json
node -e "const r=JSON.parse(require('fs').readFileSync('./screenshots/lighthouse.json','utf8'));for(const[k,v]of Object.entries(r.categories))console.log(k,Math.round(v.score*100))"
```

Expected: `performance` ≥ 95 and `accessibility` ≥ 95. If either is lower, list the failing audits (entries in `r.audits` with `score < 1`), fix only those in `src/` or `public/`, then re-run `npx playwright test`.

- [ ] **Step 3: Capture screenshots at 375 and 1440 wide in light and dark**

```bash
for scheme in light dark; do
  npx playwright screenshot --viewport-size=375,667  --color-scheme=$scheme --wait-for-timeout=1500 http://127.0.0.1:4173/ screenshots/mobile-$scheme.png
  npx playwright screenshot --viewport-size=1440,900 --color-scheme=$scheme --wait-for-timeout=1500 http://127.0.0.1:4173/ screenshots/desktop-$scheme.png
done
ls screenshots
```

Expected: four PNGs plus `lighthouse.json`. Open each PNG and check against spec §4–5: one left column, the caret visible, hairline dividers, no clipping, readable muted labels.

- [ ] **Step 4: Stop the preview server and run the suite one last time**

Run: `npx playwright test`
Expected: 20 passed.

- [ ] **Step 5: Commit any fixes from Steps 2–3**

```bash
git status --short
git add src public tests
git commit -m "fix: address Lighthouse findings"
```

(Skip if `git status` shows no source changes.)
