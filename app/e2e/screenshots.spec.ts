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

    // Mission report with a filled-in endgame.
    await page.getByRole('button', { name: 'Done', exact: true }).click()
    await page.getByRole('button', { name: 'Final scoring' }).click()
    const numInput = (label: string, i: number) =>
      page.locator('.num', { hasText: label }).nth(i).locator('input')
    await numInput('OP track', 0).fill('44')
    await numInput('Tech OP (Lab columns)', 0).fill('9')
    await numInput('Progress cubes (0–5)', 0).fill('2')
    await numInput('OP track', 1).fill('58')
    await numInput('Tech OP (Lab columns)', 1).fill('18')
    await numInput('Progress cubes (0–5)', 1).fill('4')
    await numInput('Ships in Hangar', 0).fill('2')
    await numInput('Built L1 Blueprints', 0).fill('2')
    await numInput('Colonists OP (0–21)', 0).fill('10')
    await page.locator('.verdict').waitFor()
    await page.screenshot({ path: out('report'), fullPage: true })

    // Day-side theme.
    await page.getByRole('button', { name: 'Toggle theme' }).click()
    await page.screenshot({ path: out('light'), fullPage: true })
    await page.getByRole('button', { name: 'Toggle theme' }).click()

    // Phone-sized view of the same game (autosave restores it after reload).
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await page.getByRole('button', { name: /Lacerda.s turn/ }).click()
    await page.getByRole('button', { name: '1', exact: true }).click()
    await page.locator('.steps li').first().waitFor()
    await page.screenshot({ path: out('mobile') })
  })
})
