import { createElement, StrictMode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Textimation, type TextimationProps } from 'textimation'

const container = document.getElementById('app')!
let props: TextimationProps = { text: 'Hello 🚀', animationSpeed: 50 }
const element = () =>
  createElement(StrictMode, null, createElement(Textimation, props))
const shouldHydrate = new URLSearchParams(location.search).has('hydrate')
if (shouldHydrate)
  container.innerHTML = await (await fetch('/ssr-react')).text()
const root = shouldHydrate
  ? hydrateRoot(container, element())
  : createRoot(container)
function render() {
  flushSync(() => root.render(element()))
}
// A hydration root renders from its constructor; an update before it has
// hydrated would discard the server markup instead of exercising hydration.
if (!shouldHydrate) render()
window.fixture = {
  update(patch) {
    props = { ...props, ...patch }
    render()
  },
  async destroy() {
    root.unmount()
  },
}
