import { expect, type Page } from '@playwright/test'
import { test } from './fixtures'

const visual = (page: Page) => page.locator('#app > * > span:first-child')

async function open(page: Page, query = '') {
  await page.goto(`/${query}`)
  await page.waitForFunction(() => !!window.fixture, undefined, { polling: 50 })
}

async function settle(page: Page) {
  await page.evaluate(() => {
    for (let i = 0; i < 100; i++) window.animationClock.tick(250)
  })
}

test('starts on intersection, keeps stable code-point slots, exposes accessible target, and settles', async ({
  page,
}) => {
  await open(page)
  await expect(visual(page).locator('span')).toHaveCount(7)
  await expect(page.locator('#app > span > span').nth(1)).toHaveText('Hello 🚀')
  await page.evaluate(() => {
    const first = document.querySelector('[aria-hidden="true"]')!.firstChild
    window.animationClock.tick(0)
    window.animationClock.tick(50)
    if (document.querySelector('[aria-hidden="true"]')!.firstChild !== first)
      throw new Error('Character nodes were replaced during a frame')
  })
  await settle(page)
  await expect(visual(page)).toHaveText('Hello 🚀')
  await expect(visual(page).locator('span')).toHaveCount(0)
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
})

test('handles interrupted reversions, longer/shorter strings, and empty targets', async ({
  page,
}) => {
  await open(page)
  await expect(visual(page).locator('span')).toHaveCount(7)
  await settle(page)
  await page.evaluate(() =>
    window.fixture.update({ text: 'A much longer target' }),
  )
  await expect(visual(page).locator('span')).toHaveCount(20)
  await page.evaluate(() => window.fixture.update({ text: 'Hello 🚀' }))
  await settle(page)
  await expect(visual(page)).toHaveText('Hello 🚀')
  await page.evaluate(() => window.fixture.update({ text: 'Hi' }))
  await settle(page)
  await expect(visual(page)).toHaveText('Hi')
  await page.evaluate(() => window.fixture.update({ text: '' }))
  await settle(page)
  await expect(visual(page)).toBeEmpty()
})

test('applies speed live without replacing slots; strategy changes do not replay completed text', async ({
  page,
}) => {
  await open(page)
  await expect(visual(page).locator('span')).toHaveCount(7)
  await page.evaluate(() => {
    const first = document.querySelector('[aria-hidden="true"]')!.firstChild
    window.fixture.update({
      animationSpeed: 0,
      type: 'incremental',
      keepCorrectChars: true,
    })
    if (document.querySelector('[aria-hidden="true"]')!.firstChild !== first)
      throw new Error('Tuning props restarted the animation')
    window.animationClock.tick(0)
    window.animationClock.tick(20)
    window.animationClock.tick(20)
  })
  await expect(visual(page)).toHaveText('Hello 🚀')
  await page.evaluate(() =>
    window.fixture.update({ type: 'random', animationSpeed: 100 }),
  )
  await expect(visual(page).locator('span')).toHaveCount(0)
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
})

test('locks only matching displayed characters and preserves whitespace on initial incremental run', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await open(page)
  await expect(visual(page).locator('span')).toHaveCount(7)
  await settle(page)
  await page.evaluate(() =>
    window.fixture.update({ text: 'Hello 🌍', keepCorrectChars: true }),
  )
  await expect(visual(page).locator('span').nth(0)).toHaveText('H')
  await expect(visual(page).locator('span').nth(5)).toHaveText(' ')
  await expect(visual(page).locator('span').nth(0)).toHaveClass(
    'textimation-correctChar',
  )
  await settle(page)
  await page.evaluate(() =>
    window.fixture.update({ text: 'a \tb\nc', type: 'incremental', Comp: 'p' }),
  )
  await expect(page.locator('#app > p')).toHaveCount(1)
  await expect(visual(page).locator('span')).toHaveCount(6)
  expect(await visual(page).locator('span').nth(2).textContent()).toBe('\t')
  expect(await visual(page).locator('span').nth(4).textContent()).toBe('\n')
  await settle(page)
  expect(await visual(page).textContent()).toBe('a \tb\nc')
})

test('defers idle/offscreen updates and does not replay on scroll re-entry', async ({
  page,
}) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('app')!.style.marginTop = '200vh'
    })
  })
  await open(page)
  await expect(visual(page)).toHaveCSS('opacity', '0')
  await page.evaluate(() => window.fixture.update({ text: 'Short' }))
  await expect(visual(page)).toHaveText('Short')
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
  await page.evaluate(() => document.getElementById('app')!.scrollIntoView())
  await expect(visual(page).locator('span')).toHaveCount(5)
  await settle(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect
    .poll(() =>
      page.evaluate(
        () => document.querySelector('#app')!.getBoundingClientRect().top,
      ),
    )
    .toBeGreaterThan(700)
  await page.waitForFunction(
    () => !window.animationClock.visible(),
    undefined,
    { polling: 50 },
  )
  await page.evaluate(() => window.fixture.update({ text: 'Deferred' }))
  await expect(visual(page)).toHaveText('Short')
  await page.evaluate(() => document.getElementById('app')!.scrollIntoView())
  await expect(visual(page).locator('span')).toHaveCount(8)
  await settle(page)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForFunction(
    () => !window.animationClock.visible(),
    undefined,
    { polling: 50 },
  )
  await page.evaluate(() => document.getElementById('app')!.scrollIntoView())
  await page.waitForFunction(() => window.animationClock.visible(), undefined, {
    polling: 50,
  })
  await expect(visual(page).locator('span')).toHaveCount(0)
  await expect(visual(page)).toHaveText('Deferred')
})

test('honors reduced motion and missing-observer fallback without scheduling frames', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await expect(visual(page)).toHaveCSS('opacity', '1')
  await expect(visual(page)).toHaveText('Hello 🚀')
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
  await page.evaluate(() =>
    window.fixture.update({ text: '<b>plain text</b>' }),
  )
  await expect(visual(page)).toHaveText('<b>plain text</b>')
  await expect(visual(page).locator('b')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, 'IntersectionObserver')
  })
  await open(page)
  await expect(visual(page)).toHaveCSS('opacity', '1')
  await expect(visual(page)).not.toHaveAttribute('aria-hidden')
  expect(await page.locator('#app > *').textContent()).toBe('Hello 🚀')
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
})

test('cleans up frames and observer when unmounted, and restarts on wrapper replacement', async ({
  page,
}) => {
  await open(page)
  await expect(visual(page).locator('span')).toHaveCount(7)
  await page.evaluate(() =>
    window.fixture.update({ Comp: 'h2', class: 'native', className: 'alias' }),
  )
  await expect(page.locator('#app > h2')).toHaveClass('native alias')
  await expect(visual(page).locator('span')).toHaveCount(7)
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(1)
  expect(await page.evaluate(() => window.animationClock.observers())).toBe(1)
  await settle(page)
  await page.evaluate(() => window.fixture.update({ text: 'World' }))
  await settle(page)
  await page.evaluate(() => window.fixture.update({ Comp: 'p' }))
  await expect(visual(page).locator('span')).toHaveCount(5)
  await settle(page)
  await expect(page.locator('#app > p > span')).toHaveCount(1)
  await expect(visual(page)).not.toHaveAttribute('aria-hidden')
  expect(await page.locator('#app > p').textContent()).toBe('World')
  await page.evaluate(() => window.fixture.destroy())
  expect(await page.evaluate(() => window.animationClock.observers())).toBe(0)
  await expect(page.locator('#app')).toBeEmpty()
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
  await settle(page)
})

test('hydrates built package SSR without warnings and updates the imperative subtree', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error')
      errors.push(message.text())
  })
  const ssr = await (await page.request.get('/ssr')).text()
  expect(ssr.split('Hello 🚀')).toHaveLength(2)
  expect(ssr).not.toContain('aria-hidden')
  await open(page, '?hydrate')
  await expect(visual(page).locator('span')).toHaveCount(7)
  await settle(page)
  await page.evaluate(() => window.fixture.update({ text: 'Hydrated ✨' }))
  await settle(page)
  await expect(visual(page)).toHaveText('Hydrated ✨')
  expect(errors).toEqual([])
})

test('uses the latest visibility in a batched observer delivery', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.IntersectionObserver = class extends window.IntersectionObserver {
      target: Element | undefined
      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {
        super(callback, options)
        window.batchVisibility = (states) => {
          const target = this.target
          if (!target) throw new Error('No observed element')
          callback(
            states.map((isIntersecting, time) => ({
              target,
              time,
              isIntersecting,
              intersectionRatio: isIntersecting ? 1 : 0,
              boundingClientRect: target.getBoundingClientRect(),
              intersectionRect: target.getBoundingClientRect(),
              rootBounds: null,
            })),
            this,
          )
        }
      }
      override observe(target: Element) {
        this.target = target
      }
    }
  })
  await open(page)
  await page.evaluate(() => window.batchVisibility([false, true]))
  await expect(visual(page).locator('span')).toHaveCount(7)
  await settle(page)
  await page.evaluate(() => window.batchVisibility([true, false]))
  await page.evaluate(() => window.fixture.update({ text: 'Deferred' }))
  await expect(visual(page)).toHaveText('Hello 🚀')
  expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
  await page.evaluate(() => window.batchVisibility([true]))
  await expect(visual(page).locator('span')).toHaveCount(8)
  await settle(page)
  await expect(visual(page)).toHaveText('Deferred')
})
