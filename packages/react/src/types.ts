import type { AnimationType } from '@textimation/core'
import type { ElementType } from 'react'

export type { AnimationType } from '@textimation/core'

export interface TextimationProps {
  text: string
  /**
   * The speed of the animation in milliseconds between character changes.
   * Finite values below 1 use 1ms; NaN and infinities fall back to 50ms.
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
   * a component that drops the ref will never animate. Changing it starts a
   * fresh instance on the new wrapper, so keep the reference stable.
   * @default 'span'
   */
  Comp?: ElementType
  /** @default 'random' */
  type?: AnimationType
}
