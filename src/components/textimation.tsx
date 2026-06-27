import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useIntersectionObserver } from 'usehooks-ts'
import {
  getAnimationCount,
  getInitialTextArray,
  updateText,
} from '@/lib/animation'
import type { TextimationProps } from '@/types'

const CORRECT_CLASS = 'textimation-correctChar'
const INCORRECT_CLASS = 'textimation-incorrectChar'

const STYLES = {
  CONTAINER: {
    position: 'relative',
    whiteSpace: 'pre-wrap',
  } as CSSProperties,
  IDLE_STATE: {
    opacity: 0,
  } as CSSProperties,
  // Standard visually-hidden pattern: removed from view but still announced by
  // assistive technology.
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

export function Textimation({
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

  // Latest values of the tuning props, read by the imperative loop. Keeping
  // them in a ref (instead of the effect's dependency array) means changing
  // them mid-animation no longer tears the running animation down — speed
  // changes apply on the next frame, while type/keepCorrectChars apply to the
  // next animation. See the effect below.
  const liveProps = useRef({ animationSpeed, keepCorrectChars, type })
  liveProps.current.animationSpeed = animationSpeed
  liveProps.current.keepCorrectChars = keepCorrectChars
  liveProps.current.type = type

  // Source of truth for what each character span currently shows. Computed
  // once (lazily) rather than on every render.
  const displayTextArray = useRef<string[] | null>(null)
  displayTextArray.current ??= getInitialTextArray(text)

  const textRef = useRef<HTMLSpanElement>(null)
  const previousTextRef = useRef('')
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shouldStart = isIntersecting || state === 'animating'

  useEffect(() => {
    if (!shouldStart) return
    if (text === previousTextRef.current) return
    const container = textRef.current
    if (!container) return

    const oldText = previousTextRef.current
    const animationCount = getAnimationCount(
      text,
      oldText,
      liveProps.current.keepCorrectChars,
      liveProps.current.type,
    )
    const count = animationCount.length

    // Re-base the display buffer to this animation's length, preserving any
    // already-correct (locked) leading characters carried over from the
    // previous text.
    const display = displayTextArray.current as string[]
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
        const cls = char === text[i] ? CORRECT_CLASS : INCORRECT_CLASS
        if (span.className !== cls) span.className = cls
      }
    }

    function animate() {
      if (!textRef.current) return

      for (let i = 0; i < count; i++) {
        if (animationCount[i] === -1) continue
        animationCount[i]!--
      }

      updateText(display, animationCount, text)
      paint()

      // Finished the moment every character has settled (count <= 0), so there
      // is no idle trailing frame before we snap to the final text.
      if (animationCount.every((c) => c <= 0)) {
        displayTextArray.current = text.split('')
        textRef.current.textContent = text
        previousTextRef.current = text
        setState('finished')
        return
      }

      animationRef.current = setTimeout(
        animate,
        liveProps.current.animationSpeed,
      )
    }

    animate()

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [text, shouldStart])

  return (
    <Comp ref={ref} style={STYLES.CONTAINER} className={className}>
      <span
        ref={textRef}
        aria-hidden="true"
        style={state === 'idle' ? STYLES.IDLE_STATE : undefined}
      >
        {text}
      </span>
      <span style={STYLES.SR_ONLY}>{text}</span>
    </Comp>
  )
}
