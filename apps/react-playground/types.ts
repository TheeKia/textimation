// Shared playground module: config shape, control options, sensible defaults,
// and a single re-export of the library under test so every other file imports
// it from one place using the local workspace package.

import type { AnimationType } from 'textimation'
import { Textimation } from 'textimation'

export type { AnimationType }
export { Textimation }

/** Elements offered for the `Comp` prop. */
export type CompTag = 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3'

export type ThemeChoice = 'system' | 'light' | 'dark'

/** Every Textimation prop the playground can drive, held as one object. */
export interface PlaygroundConfig {
  text: string
  animationSpeed: number
  type: AnimationType
  keepCorrectChars: boolean
  comp: CompTag
  className: string
}

export const DEFAULT_CONFIG: PlaygroundConfig = {
  text: 'Hello, world!',
  animationSpeed: 80,
  type: 'incremental',
  keepCorrectChars: true,
  comp: 'p',
  className: '',
}

export const TYPE_OPTIONS: { label: string; value: AnimationType }[] = [
  { label: 'Random', value: 'random' },
  { label: 'Incremental', value: 'incremental' },
]

export const COMP_OPTIONS: { label: string; value: CompTag }[] = [
  { label: 'span', value: 'span' },
  { label: 'p', value: 'p' },
  { label: 'div', value: 'div' },
  { label: 'h1', value: 'h1' },
  { label: 'h2', value: 'h2' },
  { label: 'h3', value: 'h3' },
]

export const THEME_OPTIONS: { label: string; value: ThemeChoice }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]
