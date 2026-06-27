import { expect, test } from 'bun:test'
import {
  getAnimationCount,
  getInitialTextArray,
  updateText,
} from '../src/lib/animation'
import { RANDOM_CHARS } from '../src/lib/random'

// Codepoints the masking step relies on.
const NBSP = 0xa0 // U+00A0 non-breaking space (visible chars are masked with this)
const SPACE = 0x20
const TAB = 0x09
const NEWLINE = 0x0a

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

// --- getAnimationCount ---------------------------------------------------

test('getAnimationCount length matches the longer of old and new text', () => {
  expect(getAnimationCount('abc', 'ab', false, 'random')).toHaveLength(3)
  expect(getAnimationCount('ab', 'abcd', false, 'random')).toHaveLength(4)
})

test('getAnimationCount marks already-correct characters as -1 when keepCorrectChars is set', () => {
  expect(getAnimationCount('abc', 'abc', true, 'random')).toEqual([-1, -1, -1])
  expect(getAnimationCount('abc', 'abc', true, 'incremental')).toEqual([
    -1, -1, -1,
  ])
})

test('getAnimationCount animates matching characters when keepCorrectChars is unset', () => {
  for (const count of getAnimationCount('abc', 'abc', false, 'random')) {
    expect(count).toBeGreaterThanOrEqual(8)
    expect(count).toBeLessThanOrEqual(20)
  }
})

test('getAnimationCount reveals whitespace immediately on the initial render', () => {
  const counts = getAnimationCount('a b', '', false, 'random')
  expect(counts[1]).toBe(1) // the space is shown at once
  expect(counts[0]).toBeGreaterThanOrEqual(8) // 'a' scrambles
  expect(counts[2]).toBeGreaterThanOrEqual(8) // 'b' scrambles
})

test('getAnimationCount (incremental) gives removed characters a longer scramble', () => {
  const counts = getAnimationCount('ab', 'abcd', false, 'incremental')
  expect(counts).toHaveLength(4)
  expect(counts[2]).toBeGreaterThanOrEqual(8)
  expect(counts[3]).toBeGreaterThanOrEqual(8)
})

// --- updateText ----------------------------------------------------------

test('updateText keeps locked chars, resolves finished ones, scrambles the rest', () => {
  const current = ['x', 'y', 'z']
  updateText(current, [-1, 0, 5], 'abc')
  expect(current[0]).toBe('x') // -1 → left untouched
  expect(current[1]).toBe('b') // 0 → resolved to the target char
  expect(RANDOM_CHARS).toContain(current[2]) // > 0 → random scramble char
})
