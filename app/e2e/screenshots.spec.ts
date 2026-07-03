import { test } from '@playwright/test'

/**
 * Captures the README screenshots from the production build.
 * Run with: npm run screenshots  (skipped in normal test runs)
 */
test.describe('README screenshots', () => {
  test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to generate')

  const out = (name: string) => `../screenshots/${name}.png`

  test('capture', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 860 })
    await page.goto('./')
    await page.getByRole('heading', { name: 'On Mars Solo — Setup' }).waitFor()
    await page.screenshot({ path: out('setup'), fullPage: true })

    await page.getByRole('button', { name: 'Start game' }).click()
    await page.getByRole('button', { name: /Lacerda.s turn/ }).click()
    await page.getByRole('heading', { name: /Colonists already/ }).waitFor()
    await page.screenshot({ path: out('question') })

    await page.getByRole('button', { name: '0', exact: true }).click()
    await page.locator('.steps li').first().waitFor()
    await page.screenshot({ path: out('turn'), fullPage: true })

    // Phone-sized view of the same game (autosave restores it after reload).
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await page.getByRole('button', { name: /Lacerda.s turn/ }).click()
    await page.getByRole('button', { name: '1', exact: true }).click()
    await page.locator('.steps li').first().waitFor()
    await page.screenshot({ path: out('mobile') })
  })
})
