import { useEffect, useMemo, useRef, useState } from 'react'
import { useIntersectionObserver } from 'usehooks-ts'
import { getRandomChar } from './utils'

interface TextimationProps {
  text: string
  animationSpeed?: number // ms between character changes
  className?: string
  keepCorrectChars?: boolean
  Comp?: React.ElementType
}

export function Textimation({
  text,
  animationSpeed = 50,
  className = '',
  keepCorrectChars = false,
  Comp = 'span',
}: TextimationProps): React.ReactNode {
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0,
  })

  const [state, setState] = useState<'idle' | 'animating' | 'finished'>('idle')

  const displayTextArray = useRef<string[]>(
    text.replace(/\s/g, ' ').replace(/\S/g, '\u00A0').split(''),
  )
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
    const maxLength = Math.max(oldText.length, text.length)

    const animationCount = Array.from({ length: maxLength }, (_, i) => {
      if (keepCorrectChars && oldText[i] === text[i]) return -1
      if (oldText.length === 0 && text[i] === ' ') return 1
      return Math.max(5, Math.ceil(Math.random() * 20))
    })

    function animate() {
      if (animationCount.every((count) => count < 0)) {
        displayTextArray.current = text.split('')
        if (textRef.current) {
          textRef.current!.textContent = text
        }
        previousTextRef.current = text
        setState('finished')
        return
      }

      for (let i = 0; i < animationCount.length; i++) {
        if (animationCount[i] === -1) continue
        animationCount[i]!--
      }

      if (textRef.current) {
        updateText(displayTextArray.current, animationCount, text)
        textRef.current!.innerHTML = displayTextArray.current
          .map((c, i) => {
            if (c === text[i]) {
              return `<span>${c}</span>`
            } else {
              return `<span class="textimation-incorrectChar">${c}</span>`
            }
          })
          .join('')
      }

      animationRef.current = setTimeout(animate, animationSpeed)
    }

    animate()

    return () => {
      setState('idle')
      previousTextRef.current = text
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [text, animationSpeed, keepCorrectChars, shouldStart])

  return (
    <Comp ref={ref} style={{ position: 'relative' }} className={className}>
      {state === 'idle' && (
        <span style={{ position: 'absolute', inset: 0, opacity: 0 }}>
          {text}
        </span>
      )}
      <span ref={textRef} />
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
