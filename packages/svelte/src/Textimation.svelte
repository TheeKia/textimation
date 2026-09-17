<script lang="ts">
  import { untrack } from 'svelte'
  import type { Attachment } from 'svelte/attachments'
  import {
    advanceFrame,
    computeSteps,
    getAnimationCount,
    getInitialTextArray,
  } from './internal/animation.js'
  import type { TextimationProps } from './types.js'

  let {
    text,
    animationSpeed = 50,
    type = 'random',
    keepCorrectChars = false,
    Comp = 'span',
    class: classValue = '',
    className = '',
  }: TextimationProps = $props()

  // Svelte owns the initial SSR/hydration text; the attachment owns every
  // subsequent visual update. Never reactively render `text` into this span.
  const initialText = untrack(() => text)

  const animate: Attachment<HTMLSpanElement> = (container) => {
    let visible = $state(false)
    let display: (string | undefined)[] = []
    let committedText: string | null = null
    let started = false
    let running = false
    let raf: number | undefined
    const canObserve = typeof IntersectionObserver !== 'undefined'

    function cancel() {
      if (raf !== undefined) cancelAnimationFrame(raf)
      raf = undefined
    }

    function start(target: string, isVisible: boolean) {
      if (!started && container.textContent !== target) {
        // Reserve the current target's layout without allocating a mask until
        // the animation can actually start.
        container.textContent = target
      }
      if ((!isVisible && !running && canObserve) || target === committedText)
        return

      cancel()
      const firstRun = !started || running
      const wasStarted = started
      committedText = target
      started = true
      const targetChars = Array.from(target)
      const finish = () => {
        running = false
        raf = undefined
        display = targetChars
        container.textContent = target
        container.style.opacity = '1'
      }

      if (
        !canObserve ||
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ) {
        finish()
        return
      }

      if (!wasStarted) display = getInitialTextArray(target)
      const counts = getAnimationCount(
        targetChars,
        display,
        firstRun,
        keepCorrectChars,
        type,
      )
      display.length = counts.length
      const fragment = document.createDocumentFragment()
      const spans = counts.map(() => {
        const span = document.createElement('span')
        fragment.appendChild(span)
        return span
      })
      container.replaceChildren(fragment)
      container.style.opacity = '1'
      running = true

      function paint() {
        for (let i = 0; i < spans.length; i++) {
          const span = spans[i]!
          const char = display[i]
          const value = char ?? ''
          const className =
            char === undefined
              ? ''
              : char === targetChars[i]
                ? 'textimation-correctChar'
                : 'textimation-incorrectChar'
          if (span.textContent !== value) span.textContent = value
          if (span.className !== className) span.className = className
        }
      }

      let lastTime: number | undefined
      let accumulatedMs = 0
      function tick(now: number) {
        accumulatedMs += Math.min(now - (lastTime ?? now), 250)
        lastTime = now
        const { steps, remainderMs } = computeSteps(
          accumulatedMs,
          animationSpeed,
        )
        accumulatedMs = remainderMs
        if (steps > 0) {
          let unsettled = 0
          for (let step = 0; step < steps; step++) {
            unsettled = advanceFrame(display, counts, targetChars)
            if (unsettled === 0) break
          }
          if (unsettled === 0) {
            finish()
            return
          }
          paint()
        }
        raf = requestAnimationFrame(tick)
      }

      if (advanceFrame(display, counts, targetChars) === 0) {
        finish()
      } else {
        paint()
        raf = requestAnimationFrame(tick)
      }
    }

    const observer = canObserve
      ? new IntersectionObserver((entries) => {
          // A delivery can contain several crossings for the same wrapper.
          // Use the latest queued state rather than the first crossing.
          const latest = entries.at(-1)
          if (latest) visible = latest.isIntersecting
        })
      : undefined
    // Observe the wrapper, whose layout includes the invisible initial text.
    observer?.observe(container.parentElement!)

    $effect(() => {
      const target = text
      // Only text and visibility trigger this effect. Speed is read live by
      // tick; strategy and locking are sampled at the next animation start.
      const isVisible = visible
      untrack(() => start(target, isVisible))
    })

    return () => {
      cancel()
      observer?.disconnect()
    }
  }
</script>

<svelte:element
  this={Comp}
  class={[classValue, className].filter(Boolean).join(' ') || undefined}
  style="position: relative; white-space: pre-wrap"
>
  <span aria-hidden="true" style="opacity: 0" {@attach animate}
    >{initialText}</span
  >
  <span
    style="position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0"
    >{text}</span
  >
</svelte:element>
