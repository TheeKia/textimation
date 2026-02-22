import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useIntersectionObserver } from 'usehooks-ts'
import { getRandomChar } from './utils'

interface TextimationProps {
  text: string
  /**
   * The speed of the animation in milliseconds between character changes
   * @default 50
   */
  animationSpeed?: number
  className?: string
  /** @default false */
  keepCorrectChars?: boolean
  /** @default 'span' */
  Comp?: ElementType
  /** @default 'random' */
  type?: 'random' | 'incremental'
}

const STYLES = {
  CONTAINER: {
    position: 'relative',
    whiteSpace: 'pre-wrap',
  } as CSSProperties,
  IDLE_STATE: {
    opacity: 0,
  } as CSSProperties,
}

function getAnimationCount(
  text: string,
  oldText: string,
  keepCorrectChars: boolean,
  type: TextimationProps['type'],
) {
  const PRESERVE_CHARS = new Set([' ', '\n', '\t'])
  const maxLength = Math.max(oldText.length, text.length)

  switch (type) {
    case 'incremental': {
      return Array.from({ length: maxLength }, (_, i) => {
        if (keepCorrectChars && oldText[i] === text[i]) return -1
        if (oldText.length === 0 && PRESERVE_CHARS.has(text[i]!)) return 1
        if (oldText.length > 0 && text[i] === undefined) {
          return Math.max(8, Math.ceil(Math.random() * 20))
        }
        return Math.ceil(Math.random() * 3 + i / 2)
      })
    }
    default: {
      return Array.from({ length: maxLength }, (_, i) => {
        if (keepCorrectChars && oldText[i] === text[i]) return -1
        if (oldText.length === 0 && PRESERVE_CHARS.has(text[i]!)) return 1
        return Math.max(8, Math.ceil(Math.random() * 20))
      })
    }
  }
}

function getInitialTextArray(text: string): string[] {
  return text
    .replaceAll(/[^\S\n\t]/g, ' ')
    .replaceAll(/[^\s]/g, '\u00A0')
    .split('')
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

function updateText(
  current: string[],
  animationCount: number[],
  targetText: string,
): void {
  for (let i = 0; i < animationCount.length; i++) {
    switch (animationCount[i]) {
      case -1:
        break
      case 0:
        current[i] = targetText[i]!
        break
      default:
        current[i] = getRandomChar()
        break
    }
  }
}
