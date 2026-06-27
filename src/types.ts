import type { ElementType } from 'react'

/** Strategy used to scramble characters on their way to the final text. */
export type AnimationType = 'random' | 'incremental'

export interface TextimationProps {
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
  type?: AnimationType
}
