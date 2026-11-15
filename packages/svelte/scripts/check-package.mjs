import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { compile } from 'svelte/compiler'

const dist = new URL('../dist/', import.meta.url)
for (const name of await readdir(dist, { recursive: true })) {
  if (!/\.(js|ts|svelte)$/.test(name)) continue
  const source = await readFile(
    new URL(name.replaceAll('\\', '/'), dist),
    'utf8',
  )
  assert.ok(
    !/['"]@textimation\/core['"]/.test(source),
    `${name} must not depend on the private core workspace`,
  )
}
// The bundled bridge must define what it exports: a bundler can emit a bare
// export list that still passes the private-import scan above.
const helpers = await import(new URL('internal/animation.js', dist).href)
for (const name of [
  'advanceFrame',
  'computeSteps',
  'getAnimationCount',
  'getInitialTextArray',
]) {
  assert.equal(
    typeof helpers[name],
    'function',
    `dist/internal/animation.js must export ${name}`,
  )
}
const source = await readFile(new URL('Textimation.svelte', dist), 'utf8')
for (const generate of ['client', 'server']) {
  const result = compile(source, { generate, filename: 'Textimation.svelte' })
  assert.deepEqual(result.warnings, [])
}
const css = await readFile(
  new URL(import.meta.resolve('@textimation/svelte/styles.css')),
  'utf8',
)
assert.ok(css.includes('.textimation-correctChar'))
console.log('Svelte client/server compilation, bundled core, and CSS passed')
