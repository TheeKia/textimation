import { Textimation } from '@textimation/svelte'
import { render } from 'svelte/server'

export function renderFixture(): string {
  return render(Textimation, {
    props: { text: 'Hello 🚀', animationSpeed: 50 },
  }).body
}
