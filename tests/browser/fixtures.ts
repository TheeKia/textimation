import { test as base } from '@playwright/test'

// Advance animation frames explicitly while leaving real browser layout,
// IntersectionObserver, Svelte effects, and hydration intact.
export const test = base.extend<{ animationClock: undefined }>({
  animationClock: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        let now = 0
        let nextId = 0
        const callbacks = new Map<number, FrameRequestCallback>()
        window.requestAnimationFrame = (callback) => {
          callbacks.set(++nextId, callback)
          return nextId
        }
        window.cancelAnimationFrame = (id) => {
          callbacks.delete(id)
        }
        const observers = new Set<IntersectionObserver>()
        let visible = false
        const NativeObserver = window.IntersectionObserver
        if (typeof NativeObserver !== 'undefined')
          window.IntersectionObserver = class extends NativeObserver {
            constructor(
              callback: IntersectionObserverCallback,
              options?: IntersectionObserverInit,
            ) {
              super((entries, observer) => {
                visible = entries.at(-1)?.isIntersecting ?? false
                callback(entries, observer)
              }, options)
              observers.add(this)
            }
            override disconnect() {
              observers.delete(this)
              super.disconnect()
            }
          }
        window.animationClock = {
          tick(elapsed) {
            now += elapsed
            const frame = [...callbacks.values()]
            callbacks.clear()
            for (const callback of frame) callback(now)
          },
          pending: () => callbacks.size,
          observers: () => observers.size,
          visible: () => visible,
        }
      })
      await use(undefined)
    },
    { auto: true },
  ],
})
