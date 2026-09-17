import type { AnimationType } from './internal/animation.js'

export type { AnimationType } from './internal/animation.js'

/** HTML wrappers that can contain the component's text spans. */
export type TextimationTag =
  | 'span'
  | 'p'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'strong'
  | 'em'
  | 'code'
  | 'pre'
  | 'label'

export interface TextimationProps {
  text: string
  /**
   * Milliseconds per logic step. Finite values below 1 use 1ms; NaN and
   * infinities fall back to 50ms.
   * @default 50
   */
  animationSpeed?: number
  /** Scramble strategy, applied at the next animation start. @default 'random' */
  type?: AnimationType
  /** Preserve matching displayed characters on the next run. @default false */
  keepCorrectChars?: boolean
  /** HTML wrapper tag. Changing it creates a fresh animation. @default 'span' */
  Comp?: TextimationTag
  /** Svelte-style wrapper class. */
  class?: string
  /** React-compatible alias; combined with `class` when both are supplied. */
  className?: string
}
