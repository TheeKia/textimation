import { expect, type Page } from '@playwright/test'
import { test } from './fixtures'

const wrapper = (page: Page) => page.locator('#app > *')
const spans = (page: Page) => page.locator('#app > * > span')
const visual = (page: Page) => spans(page).first()
const standIn = (page: Page) => spans(page).nth(1)

async function open(page: Page, url: string) {
  await page.goto(url)
  await page.waitForFunction(() => !!window.fixture, undefined, { polling: 50 })
}

async function settle(page: Page) {
  await page.evaluate(() => {
    for (let i = 0; i < 100; i++) window.animationClock.tick(250)
  })
}

// The visual span is the only copy of the text and is not hidden from
// assistive technology.
async function expectSingleCopy(page: Page, text: string) {
  await expect(spans(page)).toHaveCount(1)
  await expect(visual(page)).not.toHaveAttribute('aria-hidden')
  expect(await wrapper(page).textContent()).toBe(text)
}

// The visual span shows something else, so it is hidden and an exposed
// stand-in carries the target.
async function expectStandIn(page: Page, text: string) {
  await expect(visual(page)).toHaveAttribute('aria-hidden', 'true')
  await expect(spans(page)).toHaveCount(2)
  await expect(standIn(page)).not.toHaveAttribute('aria-hidden')
  await expect(standIn(page)).toBeVisible()
  expect(await standIn(page).textContent()).toBe(text)
}

// What assistive technology is given for the whole component.
async function expectAccessibleText(page: Page, text: string) {
  await expect(page.locator('#app')).toMatchAriaSnapshot(`- text: ${text}`)
}

async function setVisible(page: Page, visible: boolean) {
  await page.evaluate((show) => {
    if (show) document.getElementById('app')!.scrollIntoView()
    else window.scrollTo(0, 0)
  }, visible)
  await page.waitForFunction(
    (show) => window.animationClock.visible() === show,
    visible,
    { polling: 50 },
  )
}

for (const [framework, url] of [
  ['Svelte', '/'],
  ['React', '/react.html'],
] as const) {
  test(`${framework} renders the text once, adding a stand-in only while the visual span differs`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('app')!.style.marginTop = '200vh'
      })
    })
    await open(page, url)

    // Idle: the transparent layout text is the only copy.
    await expectSingleCopy(page, 'Hello 🚀')
    await expectAccessibleText(page, 'Hello 🚀')

    await setVisible(page, true)
    await expect(visual(page).locator('span')).toHaveCount(7)
    await expectStandIn(page, 'Hello 🚀')
    await expectAccessibleText(page, 'Hello 🚀')
    await settle(page)
    await expectSingleCopy(page, 'Hello 🚀')
    await expectAccessibleText(page, 'Hello 🚀')

    // Settled offscreen with a deferred target: the stale visual text is
    // hidden and the stand-in carries the new target until it can animate.
    await setVisible(page, false)
    await page.evaluate(() => window.fixture.update({ text: 'Deferred' }))
    await expectStandIn(page, 'Deferred')
    await expectAccessibleText(page, 'Deferred')
    await expect(visual(page)).toHaveText('Hello 🚀')
    await page.evaluate(() => window.fixture.update({ text: 'Hello 🚀' }))
    await expectSingleCopy(page, 'Hello 🚀')
  })

  test(`${framework} settles to a single copy after interrupted, shorter, empty, and reduced-motion runs`, async ({
    page,
  }) => {
    await open(page, url)
    await expect(visual(page).locator('span')).toHaveCount(7)

    // Interrupt the first run, then revert to the original target mid-run.
    await page.evaluate(() =>
      window.fixture.update({ text: 'A much longer target' }),
    )
    await expectStandIn(page, 'A much longer target')
    await page.evaluate(() => window.fixture.update({ text: 'Hello 🚀' }))
    await expectStandIn(page, 'Hello 🚀')
    await settle(page)
    await expectSingleCopy(page, 'Hello 🚀')

    await page.evaluate(() =>
      window.fixture.update({
        text: 'He \t🌍\n',
        type: 'incremental',
        keepCorrectChars: true,
      }),
    )
    await expectStandIn(page, 'He \t🌍\n')
    await settle(page)
    await expectSingleCopy(page, 'He \t🌍\n')

    await page.evaluate(() => window.fixture.update({ text: '' }))
    await expectStandIn(page, '')
    await settle(page)
    await expectSingleCopy(page, '')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.evaluate(() => window.fixture.update({ text: 'Calm' }))
    await expectSingleCopy(page, 'Calm')
    expect(await page.evaluate(() => window.animationClock.pending())).toBe(0)
  })
}
