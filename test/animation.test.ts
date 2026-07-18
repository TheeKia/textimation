import { expect, test } from 'bun:test'
import {
  advanceFrame,
  computeSteps,
  getAnimationCount,
  getInitialTextArray,
  MAX_STEPS_PER_TICK,
} from '../src/lib/animation'
import { RANDOM_CHARS } from '../src/lib/random'

// Codepoints the masking step relies on.
const NBSP = 0xa0 // U+00A0 non-breaking space (visible chars are masked with this)
const SPACE = 0x20
const TAB = 0x09
const NEWLINE = 0x0a

/** Split into code points, the same way the component feeds the lib. */
const chars = (text: string): string[] => Array.from(text)

// --- getInitialTextArray -------------------------------------------------

test('getInitialTextArray masks every visible character with a non-breaking space', () => {
  const codes = getInitialTextArray('ab').map((c) => c.charCodeAt(0))
  expect(codes).toEqual([NBSP, NBSP])
})

test('getInitialTextArray preserves spaces, tabs and newlines while masking the rest', () => {
  const codes = getInitialTextArray('a b\tc\nd').map((c) => c.charCodeAt(0))
  expect(codes).toEqual([NBSP, SPACE, NBSP, TAB, NBSP, NEWLINE, NBSP])
})

test('getInitialTextArray returns an empty array for an empty string', () => {
  expect(getInitialTextArray('')).toEqual([])
})

test('getInitialTextArray masks an astral code point as a single slot', () => {
  // Without the `u` regex flag each surrogate half matches \S separately,
  // producing two masks for one emoji.
  const codes = getInitialTextArray('🚀').map((c) => c.charCodeAt(0))
  expect(codes).toEqual([NBSP])
})

test('getInitialTextArray keeps mask length equal to code-point length for mixed text', () => {
  const codes = getInitialTextArray('a 🚀').map((c) => c.charCodeAt(0))
  expect(codes).toEqual([NBSP, SPACE, NBSP])
})

// --- getAnimationCount ---------------------------------------------------
// Signature: (targetChars, currentChars, firstRun, keepCorrectChars, type).
// `currentChars` is what is actually displayed right now — the last finished
// text after a completed animation, the NBSP mask on the first run, or a
// mid-scramble buffer when an animation was interrupted.

test('getAnimationCount length matches the longer of displayed and new text', () => {
  expect(
    getAnimationCount(chars('abc'), chars('ab'), false, false, 'random'),
  ).toHaveLength(3)
  expect(
    getAnimationCount(chars('ab'), chars('abcd'), false, false, 'random'),
  ).toHaveLength(4)
})

test('getAnimationCount marks already-displayed characters as -1 when keepCorrectChars is set', () => {
  expect(
    getAnimationCount(chars('abc'), chars('abc'), false, true, 'random'),
  ).toEqual([-1, -1, -1])
  expect(
    getAnimationCount(chars('abc'), chars('abc'), false, true, 'incremental'),
  ).toEqual([-1, -1, -1])
})

test('getAnimationCount locks only slots whose displayed char matches the target', () => {
  // Interrupted-animation case: the display holds a mix of settled and
  // mid-scramble characters. Only the truly-correct slot may lock.
  const counts = getAnimationCount(
    chars('ab'),
    ['a', 'X'],
    false,
    true,
    'random',
  )
  expect(counts[0]).toBe(-1)
  expect(counts[1]).toBeGreaterThanOrEqual(8)
})

test('getAnimationCount locks already-empty slots past a shorter target', () => {
  const counts = getAnimationCount(
    chars('a'),
    ['a', undefined],
    false,
    true,
    'random',
  )
  expect(counts).toEqual([-1, -1])
})

test('getAnimationCount animates matching characters when keepCorrectChars is unset', () => {
  for (const count of getAnimationCount(
    chars('abc'),
    chars('abc'),
    false,
    false,
    'random',
  )) {
    expect(count).toBeGreaterThanOrEqual(8)
    expect(count).toBeLessThanOrEqual(20)
  }
})

test('getAnimationCount reveals whitespace immediately on the first run', () => {
  const counts = getAnimationCount(
    chars('a b'),
    getInitialTextArray('a b'),
    true,
    false,
    'random',
  )
  expect(counts[1]).toBe(1) // the space is shown at once
  expect(counts[0]).toBeGreaterThanOrEqual(8) // 'a' scrambles
  expect(counts[2]).toBeGreaterThanOrEqual(8) // 'b' scrambles
})

test('getAnimationCount (incremental) gives removed characters a longer scramble', () => {
  const counts = getAnimationCount(
    chars('ab'),
    chars('abcd'),
    false,
    false,
    'incremental',
  )
  expect(counts).toHaveLength(4)
  expect(counts[2]).toBeGreaterThanOrEqual(8)
  expect(counts[3]).toBeGreaterThanOrEqual(8)
})

test('getAnimationCount treats an astral code point as a single slot', () => {
  expect(
    getAnimationCount(
      chars('🚀ab'),
      getInitialTextArray('🚀ab'),
      true,
      false,
      'random',
    ),
  ).toHaveLength(3)
})

test('getAnimationCount locks a matching astral code point when keepCorrectChars is set', () => {
  const counts = getAnimationCount(
    chars('🚀b'),
    chars('🚀a'),
    false,
    true,
    'random',
  )
  expect(counts[0]).toBe(-1)
  expect(counts[1]).toBeGreaterThanOrEqual(8)
})

// --- advanceFrame --------------------------------------------------------

test('advanceFrame leaves locked slots, snaps finishing ones, scrambles the rest', () => {
  const display: (string | undefined)[] = ['x', 'y', 'z']
  const counts = [-1, 1, 5]
  const unsettled = advanceFrame(display, counts, chars('abc'))
  expect(display[0]).toBe('x') // -1 → untouched
  expect(counts[0]).toBe(-1)
  expect(display[1]).toBe('b') // 1 → snaps to the target this frame…
  expect(counts[1]).toBe(-1) // …and locks
  expect(RANDOM_CHARS).toContain(display[2] as string) // > 1 → random scramble char
  expect(counts[2]).toBe(4) // decremented by exactly one
  expect(unsettled).toBe(1)
})

test('advanceFrame resolves an entry count of 0 immediately', () => {
  // The documented sentinel: 0 = "resolve to the target now".
  const display: (string | undefined)[] = ['x']
  const counts = [0]
  expect(advanceFrame(display, counts, chars('a'))).toBe(0)
  expect(display[0]).toBe('a')
  expect(counts[0]).toBe(-1)
})

test('advanceFrame resolves slots past a shorter target to undefined', () => {
  const display: (string | undefined)[] = ['x', 'y']
  const counts = [1, 1]
  expect(advanceFrame(display, counts, chars('a'))).toBe(0)
  expect(display).toEqual(['a', undefined])
})

test('advanceFrame settles a full run in exactly the largest count of frames', () => {
  const display: (string | undefined)[] = ['x', 'y', 'c']
  const counts = [3, 1, -1]
  let calls = 0
  do {
    calls++
  } while (advanceFrame(display, counts, chars('abc')) > 0)
  expect(calls).toBe(3) // returns 0 on the settling frame — no trailing frame
  expect(display).toEqual(['a', 'b', 'c'])
})

test('advanceFrame reveals preserved whitespace on the first frame end-to-end', () => {
  const target = chars('a b')
  const display: (string | undefined)[] = getInitialTextArray('a b')
  const counts = getAnimationCount(target, display, true, false, 'random')
  advanceFrame(display, counts, target)
  expect(display[1]).toBe(' ')
})

// --- computeSteps --------------------------------------------------------

test('computeSteps yields no steps before a full interval has accumulated', () => {
  expect(computeSteps(0, 50)).toEqual({ steps: 0, remainderMs: 0 })
  expect(computeSteps(49, 50)).toEqual({ steps: 0, remainderMs: 49 })
})

test('computeSteps converts whole intervals into steps and keeps the remainder', () => {
  expect(computeSteps(150, 50)).toEqual({ steps: 3, remainderMs: 0 })
  expect(computeSteps(130, 50)).toEqual({ steps: 2, remainderMs: 30 })
})

test('computeSteps caps steps per tick and discards the excess backlog', () => {
  const { steps, remainderMs } = computeSteps(50 * (MAX_STEPS_PER_TICK + 5), 50)
  expect(steps).toBe(MAX_STEPS_PER_TICK)
  expect(remainderMs).toBe(50) // clamped to one interval, not five
})

test('computeSteps treats non-positive speeds as one millisecond per step', () => {
  expect(computeSteps(5, 0)).toEqual({ steps: 5, remainderMs: 0 })
  expect(computeSteps(5, -10)).toEqual({ steps: 5, remainderMs: 0 })
})
