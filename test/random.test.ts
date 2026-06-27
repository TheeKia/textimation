import { expect, test } from 'bun:test'
import { getRandomChar, RANDOM_CHARS } from '../src/lib/random'

test('getRandomChar returns a single character drawn from RANDOM_CHARS', () => {
  for (let i = 0; i < 1000; i++) {
    const char = getRandomChar()
    expect(char).toHaveLength(1)
    expect(RANDOM_CHARS).toContain(char)
  }
})

test('RANDOM_CHARS is a non-empty pool with no whitespace', () => {
  expect(RANDOM_CHARS.length).toBeGreaterThan(0)
  expect(/\s/.test(RANDOM_CHARS)).toBe(false)
})
