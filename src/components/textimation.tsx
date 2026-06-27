import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
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

const STYLES = {
  CONTAINER: {
    position: 'relative',
    whiteSpace: 'pre-wrap',
  } as CSSProperties,
  IDLE_STATE: {
    opacity: 0,
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

  const displayTextArray = useRef<string[]>(getInitialTextArray(text))

  const textRef = useRef<HTMLSpanElement>(null)
  const previousTextRef = useRef('')
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const shouldStart = useMemo(() => {
    return isIntersecting || state === 'animating'
  }, [isIntersecting, state])

  useEffect(() => {
    if (!shouldStart) return
    if (text === previousTextRef.current) return

    setState('animating')
    const oldText = previousTextRef.current

    const animationCount = getAnimationCount(
      text,
      oldText,
      keepCorrectChars,
      type,
    )

    let isInitial = true

    function animate() {
      if (!textRef.current) return
      if (animationCount.every((count) => count < 0)) {
        displayTextArray.current = text.split('')
        textRef.current.textContent = text
        previousTextRef.current = text
        setState('finished')
        return
      }

      for (let i = 0; i < animationCount.length; i++) {
        if (animationCount[i] === -1) continue
        animationCount[i]!--
      }

      updateText(displayTextArray.current, animationCount, text)

      if (isInitial) {
        isInitial = false
        textRef.current.innerHTML = displayTextArray.current
          .map((c, i) => {
            if (c === undefined) {
              return ''
            } else if (c === text[i]) {
              return `<span class="textimation-correctChar">${c}</span>`
            } else {
              return `<span class="textimation-incorrectChar">${c}</span>`
            }
          })
          .join('')
      } else {
        const children = textRef.current.children
        for (let i = 0; i < children.length; i++) {
          const child = children[i] as HTMLSpanElement
          const newChar = displayTextArray.current[i]
          if (!newChar) {
            child.remove()
            continue
          }
          child.innerText = newChar
          if (newChar === text[i]) {
            child.classList.add('textimation-correctChar')
            child.classList.remove('textimation-incorrectChar')
          } else {
            child.classList.add('textimation-incorrectChar')
            child.classList.remove('textimation-correctChar')
          }
        }
      }

      animationRef.current = setTimeout(animate, animationSpeed)
    }

    animate()

    return () => {
      previousTextRef.current = text
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [type, text, animationSpeed, keepCorrectChars, shouldStart])

  return (
    <Comp ref={ref} style={STYLES.CONTAINER} className={className}>
      <span
        ref={textRef}
        style={state === 'idle' ? STYLES.IDLE_STATE : undefined}
      >
        {text}
      </span>
    </Comp>
  )
}
