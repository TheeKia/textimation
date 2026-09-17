import { createElement, StrictMode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { Textimation, type TextimationProps } from 'textimation'

const root = createRoot(document.getElementById('app')!)
let props: TextimationProps = { text: 'Hello 🚀', animationSpeed: 50 }
function render() {
  flushSync(() =>
    root.render(
      createElement(StrictMode, null, createElement(Textimation, props)),
    ),
  )
}
render()
window.fixture = {
  update(patch) {
    props = { ...props, ...patch }
    render()
  },
  async destroy() {
    root.unmount()
  },
}
