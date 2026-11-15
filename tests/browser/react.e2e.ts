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
  const visual = page.locator('#app > * > span:first-child')
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

test('React hydrates server markup containing the text once, without warnings', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error')
      errors.push(message.text())
  })
  const ssr = await (await page.request.get('/ssr-react')).text()
  expect(ssr.split('Hello 🚀')).toHaveLength(2)
  expect(ssr).not.toContain('aria-hidden')
  await page.goto('/react.html?hydrate')
  await page.waitForFunction(() => !!window.fixture, undefined, { polling: 50 })
  const visual = page.locator('#app > * > span:first-child')
  await expect(visual.locator('span')).toHaveCount(7)
  const settle = () =>
    page.evaluate(() => {
      for (let i = 0; i < 100; i++) window.animationClock.tick(250)
    })
  await settle()
  await page.evaluate(() => window.fixture.update({ text: 'Hydrated ✨' }))
  await settle()
  await expect(visual).toHaveText('Hydrated ✨')
  expect(await page.locator('#app > *').textContent()).toBe('Hydrated ✨')
  expect(errors).toEqual([])
})

test('React restarts on wrapper replacement and settles on the current text', async ({
  page,
}) => {
  await page.goto('/react.html')
  await page.waitForFunction(() => !!window.fixture, undefined, { polling: 50 })
  const visual = page.locator('#app > * > span:first-child')
  const settle = () =>
    page.evaluate(() => {
      for (let i = 0; i < 100; i++) window.animationClock.tick(250)
    })
  await expect(visual.locator('span')).toHaveCount(7)

  // Mid-run: the new wrapper starts over and the old run is cleaned up.
  await page.evaluate(() => window.fixture.update({ Comp: 'h2' }))
  await expect(page.locator('#app > h2')).toHaveCount(1)
  await expect(visual.locator('span')).toHaveCount(7)
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(1)
  expect(await page.evaluate(() => window.animationClock.observers())).toBe(1)
  await settle()
  await page.evaluate(() => window.fixture.update({ text: 'World' }))
  await settle()
  expect(await page.locator('#app > h2').textContent()).toBe('World')

  // Settled: the new wrapper animates the current text, not the mount-time one.
  await page.evaluate(() => window.fixture.update({ Comp: 'p' }))
  await expect(page.locator('#app > p')).toHaveCount(1)
  await expect(visual.locator('span')).toHaveCount(5)
  await settle()
  await expect(page.locator('#app > p > span')).toHaveCount(1)
  await expect(visual).not.toHaveAttribute('aria-hidden')
  expect(await page.locator('#app > p').textContent()).toBe('World')
  await page.evaluate(() => window.fixture.destroy())
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
  expect(await page.evaluate(() => window.animationClock.observers())).toBe(0)
})
