import { Textimation as SvelteTextimation } from '@textimation/svelte'
import { createElement, StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { render } from 'svelte/server'
import { Textimation as ReactTextimation } from 'textimation'

const props = { text: 'Hello 🚀', animationSpeed: 50 }

export function renderFixture(): string {
  return render(SvelteTextimation, { props }).body
}

export function renderReactFixture(): string {
  return renderToString(
    createElement(StrictMode, null, createElement(ReactTextimation, props)),
  )
}
