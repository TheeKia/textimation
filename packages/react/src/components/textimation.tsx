import {
  advanceFrame,
  computeSteps,
  getAnimationCount,
  getInitialTextArray,
} from '@textimation/core'
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useIntersectionObserver } from 'usehooks-ts'
import type { TextimationProps } from '../types'

const CORRECT_CLASS = 'textimation-correctChar'
const INCORRECT_CLASS = 'textimation-incorrectChar'

/**
 * Cap on how much wall-clock time a single rAF tick may absorb. Bounds the
 * catch-up after long jank or a hidden tab, so at most a handful of logic
 * steps replay instead of the whole missed span.
 */
const MAX_FRAME_DELTA_MS = 250

const STYLES = {
  CONTAINER: {
    position: 'relative',
    whiteSpace: 'pre-wrap',
  } as CSSProperties,
  IDLE_STATE: {
    opacity: 0,
  } as CSSProperties,
  // Standard visually-hidden pattern: removed from view but still announced by
  // assistive technology. Applied to the stand-in span that carries the target
  // text only while the visual span shows something else.
  SR_ONLY: {
    position: 'absolute',
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    border: 0,
  } as CSSProperties,
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Replacing the wrapper replaces the DOM an instance animates, while the
 * instance's state would survive and keep describing nodes that are gone.
 * Each wrapper therefore gets its own instance, exactly as a `key` change
 * would: the animation starts over on the new element with the current text.
 */
export function Textimation(props: TextimationProps): ReactNode {
  const Comp = props.Comp ?? 'span'
  // Wrapped in an object because `useState` would call a component function.
  const [wrapper, setWrapper] = useState({ Comp, generation: 0 })
  if (wrapper.Comp !== Comp) {
    setWrapper({ Comp, generation: wrapper.generation + 1 })
  }
  return <TextimationInstance key={wrapper.generation} {...props} />
}

function TextimationInstance({
  text,
  animationSpeed = 50,
  className,
  keepCorrectChars = false,
  Comp = 'span',
  type = 'random',
}: TextimationProps): ReactNode {
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0,
  })

  const [state, setState] = useState<'idle' | 'animating' | 'finished'>('idle')
  // Text the visual span last settled on. Render state (not a ref) because it
  // decides whether the visual span can serve as the accessible text.
  const [settledText, setSettledText] = useState<string | null>(null)

  // Latest values of the tuning props, read by the imperative loop. Keeping
  // them in a ref (instead of the effect's dependency array) means changing
  // them mid-animation no longer tears the running animation down — speed
  // changes apply on the next tick, while type/keepCorrectChars apply to the
  // next animation. See the effect below.
  const liveProps = useRef({ animationSpeed, keepCorrectChars, type })
  useEffect(() => {
    liveProps.current = { animationSpeed, keepCorrectChars, type }
  }, [animationSpeed, keepCorrectChars, type])

  // Source of truth for what each character span currently shows, indexed by
  // code point. `undefined` marks a slot that resolved away (shorter new
  // text). The idle effect initializes it and keeps it current until the
  // first animation, avoiding text processing during render.
  const displayTextArray = useRef<(string | undefined)[]>([])

  const textRef = useRef<HTMLSpanElement>(null)
  // Target text of the animation that is currently running or has finished.
  // Set when an animation starts and rolled back to null by the effect cleanup
  // if that run was torn down before finishing — so an interrupted animation
  // can never block a restart, even when `text` reverts to a value that
  // finished earlier (the display is mid-scramble then, not that value).
  const committedTextRef = useRef<string | null>(null)
  const rafRef = useRef<number | null>(null)

  // The animating span's React child is frozen to the mount-time text so its
  // vDOM never changes after hydration — the effect below owns that subtree
  // outright and React must never write into it again.
  const initialText = useRef(text).current

  const shouldStart = isIntersecting || state === 'animating'

  // The visual span holds exactly `text` while it waits offscreen for its first
  // run and once it has settled on the current target. It is then the only
  // copy of the text: exposed to assistive technology, with no stand-in, so
  // server output and the settled DOM never contain the text twice. An idle
  // instance that is intersecting starts scrambling in this commit's effect,
  // so it is already treated as scrambled here.
  const visualShowsText =
    state === 'idle'
      ? !isIntersecting
      : state === 'finished' && settledText === text

  // While idle the frozen (invisible) child is what reserves layout size; keep
  // that reservation current if `text` changes before the first animation.
  // Runs before the main effect so a simultaneous animation start wins.
  useEffect(() => {
    if (state !== 'idle') return
    const el = textRef.current
    if (el && el.textContent !== text) el.textContent = text
    displayTextArray.current = getInitialTextArray(text)
  }, [text, state])

  useEffect(() => {
    if (!shouldStart) return
    if (text === committedTextRef.current) return
    const container = textRef.current
    if (!container) return

    const firstRun = committedTextRef.current === null
    committedTextRef.current = text
    let finished = false

    const targetChars = Array.from(text)

    const finish = (): void => {
      finished = true
      displayTextArray.current = targetChars
      container.textContent = text
      setSettledText(text)
      setState('finished')
    }

    if (prefersReducedMotion()) {
      finish()
      return
    }

    // Lock/slot decisions are made against what is actually on screen (the
    // display buffer) — after an interruption that is a mid-scramble mix, not
    // the last finished text.
    const display = displayTextArray.current
    const counts = getAnimationCount(
      targetChars,
      display,
      firstRun,
      liveProps.current.keepCorrectChars,
      liveProps.current.type,
    )
    const count = counts.length

    // Re-base the display buffer to this animation's length, preserving any
    // already-correct (locked) characters carried over from the previous text.
    display.length = count

    // Build one stable span per character index up front and cache them.
    // Reusing the same nodes every frame (rather than rebuilding innerHTML or
    // removing children mid-loop) keeps the DOM<->buffer index mapping exact
    // and lets the CSS opacity transition play as characters settle.
    const spans: HTMLSpanElement[] = new Array(count)
    const fragment = document.createDocumentFragment()
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span')
      spans[i] = span
      fragment.appendChild(span)
    }
    container.replaceChildren(fragment)

    setState('animating')

    // Reconcile every span with the display buffer, writing only what changed
    // (avoids needless DOM work and avoids restarting the opacity transition).
    function paint() {
      for (let i = 0; i < count; i++) {
        const span = spans[i]!
        const char = display[i]
        // Trailing characters that have resolved away (shorter new text) keep
        // their span but render empty — never removed, so indices stay aligned.
        if (char === undefined) {
          if (span.textContent !== '') span.textContent = ''
          if (span.className !== '') span.className = ''
          continue
        }
        if (span.textContent !== char) span.textContent = char
        const cls = char === targetChars[i] ? CORRECT_CLASS : INCORRECT_CLASS
        if (span.className !== cls) span.className = cls
      }
    }

    // rAF-driven loop: accumulate real elapsed time and convert it into logic
    // steps at the live animationSpeed. Paints at most once per tick, does no
    // DOM work at all on ticks with no step due, pauses for free in hidden
    // tabs, and finishes the moment every slot settles (no trailing frame).
    let lastTime: number | null = null
    let accumulatedMs = 0

    function tick(now: number) {
      if (lastTime === null) lastTime = now
      accumulatedMs += Math.min(now - lastTime, MAX_FRAME_DELTA_MS)
      lastTime = now

      const { steps, remainderMs } = computeSteps(
        accumulatedMs,
        liveProps.current.animationSpeed,
      )
      accumulatedMs = remainderMs

      if (steps > 0) {
        let unsettled = 0
        for (let s = 0; s < steps; s++) {
          unsettled = advanceFrame(display, counts, targetChars)
          if (unsettled === 0) break
        }
        if (unsettled === 0) {
          finish()
          return
        }
        paint()
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    // The first logic frame runs synchronously so the scramble is visible in
    // the same task that swapped the spans in — no blank frame at start.
    const unsettled = advanceFrame(display, counts, targetChars)
    if (unsettled === 0) {
      finish()
      return
    }
    paint()
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      // This run was torn down before finishing (text change, StrictMode
      // remount, unmount) — roll back the commit so the next run restarts.
      if (!finished) committedTextRef.current = null
    }
  }, [text, shouldStart])

  return (
    <Comp ref={ref} style={STYLES.CONTAINER} className={className}>
      <span
        ref={textRef}
        aria-hidden={visualShowsText ? undefined : true}
        style={state === 'idle' ? STYLES.IDLE_STATE : undefined}
      >
        {initialText}
      </span>
      {visualShowsText ? null : <span style={STYLES.SR_ONLY}>{text}</span>}
    </Comp>
  )
}
