import { getRandomChar } from '@/lib/random'
import type { AnimationType } from '@/types'

/** Whitespace that is revealed instantly instead of being scrambled. */
const PRESERVE_CHARS = new Set([' ', '\n', '\t'])

/** U+00A0 non-breaking space — the placeholder for not-yet-revealed characters. */
const MASK_CHAR = String.fromCharCode(0xa0)

/**
 * Upper bound on logic steps a single rAF tick may replay when catching up
 * after jank or a mid-animation speed drop (see `computeSteps`).
 */
export const MAX_STEPS_PER_TICK = 10

/**
 * Builds the initial, fully-masked representation of `text`: every visible
 * character becomes a non-breaking space so the element reserves its final
 * size up front (avoiding layout shift), while real whitespace is kept as-is.
 * The `u` regex flags are load-bearing: without them each surrogate half of an
 * astral code point matches `\S` separately, producing two masks for one slot.
 */
export function getInitialTextArray(text: string): string[] {
  return Array.from(
    text.replaceAll(/[^\S\n\t]/gu, ' ').replaceAll(/\S/gu, MASK_CHAR),
  )
}

/**
 * Returns, per code-point index, how many scramble frames remain before that
 * character settles on its final value. `-1` means "already correct, leave it
 * alone"; `0` means "resolve to the target now".
 *
 * `currentChars` is what is **actually displayed right now** — the finished
 * text after a completed animation, the NBSP mask on the first run, or a
 * mid-scramble buffer when a running animation was interrupted by a text
 * change. Locks compare against it (never against a past target), so a slot
 * can only be locked when the character on screen is already correct, and
 * `maxLength` always covers every currently-visible slot.
 */
export function getAnimationCount(
  targetChars: readonly string[],
  currentChars: readonly (string | undefined)[],
  firstRun: boolean,
  keepCorrectChars: boolean,
  type: AnimationType,
): number[] {
  const maxLength = Math.max(currentChars.length, targetChars.length)

  switch (type) {
    case 'incremental': {
      return Array.from({ length: maxLength }, (_, i) => {
        if (keepCorrectChars && currentChars[i] === targetChars[i]) return -1
        if (firstRun && PRESERVE_CHARS.has(targetChars[i]!)) return 1
        if (targetChars[i] === undefined) {
          return Math.max(8, Math.ceil(Math.random() * 20))
        }
        return Math.ceil(Math.random() * 3 + i / 2)
      })
    }
    default: {
      return Array.from({ length: maxLength }, (_, i) => {
        if (keepCorrectChars && currentChars[i] === targetChars[i]) return -1
        if (firstRun && PRESERVE_CHARS.has(targetChars[i]!)) return 1
        return Math.max(8, Math.ceil(Math.random() * 20))
      })
    }
  }
}

/**
 * Advances the animation one frame in place and returns how many slots are
 * still unsettled (`0` means the animation finished on this very frame).
 * Per slot: `-1` is locked and untouched; a count that reaches `0` snaps to
 * its target (or `undefined` past a shorter target) and locks to `-1`;
 * anything higher decrements and shows a fresh random character.
 */
export function advanceFrame(
  display: (string | undefined)[],
  counts: number[],
  targetChars: readonly string[],
): number {
  let unsettled = 0
  for (let i = 0; i < counts.length; i++) {
    const count = counts[i]!
    if (count === -1) continue
    if (count <= 1) {
      display[i] = targetChars[i]
      counts[i] = -1
    } else {
      counts[i] = count - 1
      display[i] = getRandomChar()
      unsettled++
    }
  }
  return unsettled
}

export interface FrameStep {
  steps: number
  remainderMs: number
}

/**
 * Converts accumulated wall-clock time into whole logic steps at the given
 * speed. Steps are capped at `MAX_STEPS_PER_TICK` and the remainder is clamped
 * to a single interval, so a post-jank backlog or a mid-animation speed drop
 * can never trigger a step burst. Non-positive speeds count as 1ms per step.
 */
export function computeSteps(
  accumulatedMs: number,
  speedMs: number,
): FrameStep {
  const speed = Math.max(speedMs, 1)
  const steps = Math.min(Math.floor(accumulatedMs / speed), MAX_STEPS_PER_TICK)
  return {
    steps,
    remainderMs: Math.min(accumulatedMs - steps * speed, speed),
  }
}
