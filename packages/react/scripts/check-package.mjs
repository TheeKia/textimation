import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Textimation } from 'textimation'

// Exercise public exports: a successful bundle can still contain broken exports.
assert.equal(typeof Textimation, 'function')
for (const file of ['index.js', 'index.d.ts']) {
  const source = await readFile(
    new URL(`../dist/${file}`, import.meta.url),
    'utf8',
  )
  assert.ok(
    !/['"]@textimation\/core['"]/.test(source),
    `${file} must not depend on the private core workspace`,
  )
}
const html = renderToStaticMarkup(
  createElement(Textimation, { text: 'Hello <React>' }),
)
assert.equal(
  html.split('Hello &lt;React&gt;').length - 1,
  1,
  'server markup must contain the text exactly once',
)
assert.ok(
  !html.includes('aria-hidden'),
  'server text must stay exposed to assistive technology',
)
const css = await readFile(
  new URL(import.meta.resolve('textimation/styles.css')),
  'utf8',
)
assert.ok(css.includes('.textimation-correctChar'))
console.log('React package exports, bundled core, SSR, and CSS passed')
