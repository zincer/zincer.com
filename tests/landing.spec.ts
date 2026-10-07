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
