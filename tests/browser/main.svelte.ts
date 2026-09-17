import { Textimation, type TextimationProps } from '@textimation/svelte'
import { flushSync, hydrate, mount, unmount } from 'svelte'
import '@textimation/svelte/styles.css'

const target = document.getElementById('app')!
const props = $state<TextimationProps>({ text: 'Hello 🚀', animationSpeed: 50 })
const shouldHydrate = new URLSearchParams(location.search).has('hydrate')
if (shouldHydrate) target.innerHTML = await (await fetch('/ssr')).text()
const instance = shouldHydrate
  ? hydrate(Textimation, { target, props })
  : mount(Textimation, { target, props })
flushSync()

window.fixture = {
  update(patch) {
    flushSync(() => Object.assign(props, patch))
  },
  async destroy() {
    await unmount(instance)
  },
}
