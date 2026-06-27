import { getRandomChar } from '@/lib/random'
import type { AnimationType } from '@/types'

/** Whitespace that is revealed instantly instead of being scrambled. */
const PRESERVE_CHARS = new Set([' ', '\n', '\t'])

/** U+00A0 non-breaking space — the placeholder for not-yet-revealed characters. */
const MASK_CHAR = String.fromCharCode(0xa0)

/**
 * Builds the initial, fully-masked representation of `text`: every visible
 * character becomes a non-breaking space so the element reserves its final
 * size up front (avoiding layout shift), while real whitespace is kept as-is.
 */
export function getInitialTextArray(text: string): string[] {
  return text
    .replaceAll(/[^\S\n\t]/g, ' ')
    .replaceAll(/\S/g, MASK_CHAR)
    .split('')
}

/**
 * Returns, per character index, how many scramble frames remain before that
 * character settles on its final value. `-1` means "already correct, leave it
 * alone"; `0` means "resolve to the target now".
 */
export function getAnimationCount(
  text: string,
  oldText: string,
  keepCorrectChars: boolean,
  type: AnimationType,
): number[] {
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

/**
 * Advances `current` one frame in place: locked characters (`-1`) are left
 * untouched, finished characters (`0`) snap to their target, and everything
 * else is replaced with a fresh random character.
 */
export function updateText(
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
