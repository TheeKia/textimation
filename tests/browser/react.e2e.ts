import { expect } from '@playwright/test'
import { test } from './fixtures'

test('React refreshes idle slots after a shorter target arrives before intersection', async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('app')!.style.marginTop = '200vh'
    })
  })
  await page.goto('/react.html')
  await page.waitForFunction(() => !!window.fixture, undefined, { polling: 50 })
  const visual = page.locator('#app [aria-hidden="true"]')
  await expect(visual).toHaveCSS('opacity', '0')
  await page.evaluate(() => window.fixture.update({ text: 'Hi' }))
  await expect(visual).toHaveText('Hi')
  await page.evaluate(() => document.getElementById('app')!.scrollIntoView())
  await expect(visual.locator('span')).toHaveCount(2)
  await page.evaluate(() => {
    for (let i = 0; i < 30; i++) window.animationClock.tick(250)
  })
  await expect(visual).toHaveText('Hi')
  await page.evaluate(() => window.fixture.destroy())
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
  expect(await page.evaluate(() => window.animationClock.observers())).toBe(0)
})
