import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const fixture = JSON.parse(readFileSync('tests/fixtures/e2e-export.json', 'utf8'))
const storageKey = 'roadToTriathlonV3'

async function seedAppState(page: import('@playwright/test').Page) {
  await page.addInitScript(({ key, value }) => {
    if (sessionStorage.getItem('e2e-fixture-seeded')) return
    localStorage.setItem(key, JSON.stringify(value))
    sessionStorage.setItem('e2e-fixture-seeded', 'true')
  }, { key: storageKey, value: fixture })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Save check-in' })).toBeVisible()
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey)).not.toBeNull()
}

test('exports all saved sections, reimports the downloaded file, and restores them to the UI', async ({ page }) => {
  await seedAppState(page)
  const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), storageKey)
  await expect(page.getByRole('button', { name: 'Reset', exact: true })).toHaveCount(0)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const download = await downloadPromise
  const exported = JSON.parse(readFileSync(await download.path(), 'utf8'))
  expect(exported.exportFormat).toBe('road-to-ironman')
  expect(exported.exportManifest.includedSections).toContain('reinforcementLogs')

  await page.evaluate(key => localStorage.removeItem(key), storageKey)
  await page.reload()
  page.once('dialog', dialog => dialog.accept())
  await page.locator('input[type="file"]').setInputFiles({
    name: 'road-to-ironman-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(exported)),
  })
  await expect(page.getByRole('status')).toContainText('Data imported successfully')
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), storageKey)).toMatchObject({
    daily: before.daily,
    meals: before.meals,
    mealLogs: before.mealLogs,
    foods: before.foods,
    supplements: before.supplements,
    workoutLogs: before.workoutLogs,
    reinforcementLogs: before.reinforcementLogs,
    endurance: before.endurance,
    variantChoices: before.variantChoices,
    goalHistory: before.goalHistory,
    calendarOverrides: before.calendarOverrides,
  })

  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByText('Breakfast: E2E breakfast').first()).toBeVisible()
  await expect(page.getByText('Bench Press')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete history record' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Goals' }).click()
  await expect(page.getByText('Partially logged')).toBeVisible()
  await expect(page.getByText(/Upper A · 1\/\d+ sets/)).toBeVisible()
  await page.getByRole('button', { name: 'Nutrition' }).click()
  await page.getByRole('button', { name: 'Build from ingredients' }).click()
  await expect(page.getByRole('option', { name: 'Oats E2E' })).toBeAttached()
})

test('rejects an unrelated JSON file without changing saved data', async ({ page }) => {
  await seedAppState(page)
  const before = await page.evaluate(key => localStorage.getItem(key), storageKey)
  await page.locator('input[type="file"]').setInputFiles({
    name: 'unrelated.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ preferences: { theme: 'dark' } })),
  })

  await expect(page.getByRole('status')).toContainText('No Road to Ironman data was found')
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(before)
})

test('does not overwrite saved local data when its JSON cannot be read', async ({ page }) => {
  const corruptData = '{ this is not valid JSON'
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: storageKey, value: corruptData })
  await page.goto('/')

  await expect(page.getByText('Saved data could not be read')).toBeVisible()
  await expect.poll(() => page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(corruptData)
  await expect(page.getByRole('button', { name: 'Save check-in' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Delete unreadable data' })).toBeVisible()
})

test('shows a recovery warning when the browser refuses to save local data', async ({ page }) => {
  await page.addInitScript(key => {
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (name: string, value: string) {
      if (name === key) throw new DOMException('Storage is full', 'QuotaExceededError')
      originalSetItem.call(this, name, value)
    }
  }, storageKey)
  await page.goto('/')

  await expect(page.getByText('These changes could not be saved in this browser')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Export changes' })).toBeVisible()
})

test('does not lock an empty or invalid check-in, but saves a valid partial check-in', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Save check-in' })).toBeVisible()
  await page.getByRole('button', { name: 'Save check-in' }).click()
  await expect(page.getByRole('status')).toContainText('Add at least one check-in value')
  await expect(page.getByText("Today's check-in is saved.")).toHaveCount(0)

  await page.getByLabel('Shoulder pain /10').fill('11')
  await page.getByRole('button', { name: 'Save check-in' }).click()
  await expect(page.getByRole('status')).toContainText('Pain scores must be between 0 and 10')
  await expect(page.getByText("Today's check-in is saved.")).toHaveCount(0)

  await page.getByLabel('Shoulder pain /10').fill('2')
  await page.getByRole('button', { name: 'Save check-in' }).click()
  await expect(page.getByText("Today's check-in is saved.")).toBeVisible()
  await expect(page.getByLabel('Shoulder pain /10')).toBeDisabled()
})
