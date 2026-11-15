// Bundled into this package at build time; core is a private development dependency.
//
// Keep this a star re-export. Bun 1.4.0 bundles a named re-export of core's
// own re-exports (`export { advanceFrame } from '@textimation/core'`) into an
// export list with no definitions, which only fails once a browser loads it.
// The package check imports the built file to catch that.

export * from '@textimation/core'
