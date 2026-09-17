import type { TextimationProps } from '../../packages/svelte/src/types.js'

declare global {
  interface Window {
    batchVisibility: (states: boolean[]) => void
    fixture: {
      update: (patch: Partial<TextimationProps>) => void
      destroy: () => Promise<void>
    }
    animationClock: {
      tick: (elapsed: number) => void
      pending: () => number
      observers: () => number
      visible: () => boolean
    }
  }
}
