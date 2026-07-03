import { expect, test } from '@playwright/test'

/**
 * Plays a scripted game through the real UI (production build). The solo deck
 * is seeded from Date.now(), so assertions avoid depending on which card comes
 * up — they check the invariants that hold for every card.
 */

async function playTurn(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /Lacerda.s turn/ }).click()
  await expect(page.getByRole('heading', { name: /Colonists already on the action/ })).toBeVisible()
  await page.getByRole('button', { name: '0', exact: true }).click()
  await expect(page.locator('.steps li').first()).toContainText(/Solo card — Mission [ABC]/)
}

async function finishTurn(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.locator('.steps')).toHaveCount(0)
}

test('full solo game flow: setup, turns, records, phases, undo, resume', async ({ page }) => {
  await page.goto('./')

  // Setup wizard, with the fan-disclaimer footer already visible
  await expect(page.getByRole('heading', { name: 'On Mars Solo — Setup' })).toBeVisible()
  await expect(page.locator('footer')).toContainText('Unofficial fan companion')
  await expect(page.locator('footer')).toContainText(/v\d+\.\d+\.\d+/)
  await page.getByRole('button', { name: 'Start game' }).click()
  const header = page.locator('header')
  await expect(header).toContainText('Colony L1')
  await expect(header).toContainText('Crystals 0/6')
  await expect(header).toContainText('Bot → Mine')

  // Turn 1: reveal, instructions, record a Blueprint, then undo it.
  await playTurn(page)
  await page.getByRole('button', { name: '+ Blueprint' }).click()
  await page.getByRole('button', { name: /1\. Construction Yard/ }).click()
  await expect(header).toContainText('Blueprints 1 (0 used)')
  await page.getByRole('button', { name: /Undo/ }).click()
  await expect(header).toContainText('Blueprints 0 (0 used)')

  // Record a Scientist and a Contract (Lacerda prefers Upgrade = 12 OP).
  await page.getByRole('button', { name: '+ Scientist' }).click()
  await page.getByRole('button', { name: 'The Geologist' }).click()
  await expect(header).toContainText('Scientists 1')
  await page.getByRole('button', { name: '+ Contract' }).click()
  await page.getByRole('button', { name: 'Upgrade (12 OP)' }).click()
  await expect(header).toContainText('Contracts 1')
  await finishTurn(page)

  // Ambiguity resolver: always lands on one of the numbered options.
  await page.getByRole('button', { name: 'Resolve ambiguity' }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.locator('.steps li').first()).toContainText('Ambiguity resolved: Option')
  await finishTurn(page)

  // Shuttle phase: either travels (location flips) or the ✗ card holds him.
  await page.getByRole('button', { name: 'Shuttle phase' }).click()
  await page.getByRole('button', { name: '3', exact: true }).click()
  const shuttleStep = page.locator('.steps li').first()
  await expect(shuttleStep).toContainText(/travels to|does NOT travel/)
  if ((await shuttleStep.textContent())?.includes('travels to')) {
    await expect(header).toContainText('in the Colony')
  } else {
    await expect(header).toContainText('in Orbit')
  }
  await finishTurn(page)

  // Colony level-up interrupt grants Shelter + Ship + Bot.
  await page.getByRole('button', { name: 'Colony leveled up' }).click()
  await expect(header).toContainText('Colony L2')
  await expect(header).toContainText('Shelters 1')
  await expect(header).toContainText('Ships 1')
  await expect(header).toContainText('Bots 1')
  await finishTurn(page)

  // Autosave: a reload resumes mid-game with state intact.
  await page.reload()
  await expect(header).toContainText('Colony L2')
  await expect(header).toContainText('Scientists 1')
  await expect(page.getByRole('heading', { name: 'On Mars Solo — Setup' })).toHaveCount(0)
})

test('second pass through the deck triggers the mission-cube rule', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Start game' }).click()
  const header = page.locator('header')

  // Exhaust the 12-card deck; no mission cubes on the first pass.
  for (let i = 0; i < 12; i++) {
    await playTurn(page)
    await expect(page.locator('.steps')).not.toContainText('Second pass')
    await finishTurn(page)
  }

  // Turn 13 reshuffles: the reveal must move a Mission cube and pay Crystals.
  await playTurn(page)
  await expect(page.locator('.steps')).toContainText('Second pass: move the Mission')
  await expect(header).not.toContainText('Crystals 0/6')
  await finishTurn(page)

  // The turn log kept the whole history: 12 reveals + reveal & mission line on turn 13.
  await expect(page.locator('.log li')).toHaveCount(14)
})
