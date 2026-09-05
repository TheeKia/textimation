import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Textimation } from 'textimation'

// Exercise public exports: a successful bundle can still contain broken exports.
assert.equal(typeof Textimation, 'function')
const html = renderToStaticMarkup(
  createElement(Textimation, { text: 'Hello <React>' }),
)
assert.ok(html.includes('Hello &lt;React&gt;'))
const css = await readFile(
  new URL(import.meta.resolve('textimation/styles.css')),
  'utf8',
)
assert.ok(css.includes('.textimation-correctChar'))
console.log('React package exports, SSR, and CSS passed')
