import { expect } from '@playwright/test'
import { test } from './fixtures'

for (const [framework, url] of [
  ['Svelte', '/'],
  ['React', '/react.html'],
] as const) {
  test(`${framework} recovers from non-finite speeds and accepts live speed updates`, async ({
    page,
  }) => {
    await page.goto(url)
    const visual = page.locator('#app > * > span:first-child')
    await expect(visual.locator('span')).toHaveCount(7)
    await page.evaluate(() => {
      for (const speed of [
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
      ]) {
        window.fixture.update({ animationSpeed: speed })
        window.animationClock.tick(50)
      }
      window.fixture.update({ animationSpeed: 0 })
      window.animationClock.tick(20)
      window.animationClock.tick(20)
    })
    await expect(visual).toHaveText('Hello 🚀')
    await expect(visual.locator('span')).toHaveCount(0)
    expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
  })

  test(`${framework} makes no DOM writes when no logic step is due`, async ({
    page,
  }) => {
    await page.goto(url)
    await expect(page.locator('#app [aria-hidden="true"] > span')).toHaveCount(
      7,
    )
    const writes = await page.evaluate(() => {
      const container = document.querySelector('[aria-hidden="true"]')!
      const observer = new MutationObserver(() => {})
      observer.observe(container, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      })
      window.animationClock.tick(0)
      window.animationClock.tick(49)
      const count = observer.takeRecords().length
      observer.disconnect()
      return count
    })
    expect(writes).toBe(0)
    await page.evaluate(() => window.fixture.destroy())
    expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
  })
}
