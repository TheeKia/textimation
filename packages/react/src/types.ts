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
  /**
   * Element type rendered as the outer wrapper. Must be an intrinsic tag
   * (e.g. `'span'`, `'div'`, `'h1'`) or a component that forwards its `ref` to
   * a DOM element — the ref is what scroll-into-view detection attaches to, so
   * a component that drops the ref will never animate.
   * @default 'span'
   */
  Comp?: ElementType
  /** @default 'random' */
  type?: AnimationType
}
