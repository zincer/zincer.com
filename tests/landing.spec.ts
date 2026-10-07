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
