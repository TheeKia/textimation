import { defineConfig } from 'bunup'

export default defineConfig({
  // `src/styles.css` is emitted as a standalone `dist/styles.css`; it is never
  // injected into the JS bundle, so consumers opt in via `textimation/styles.css`.
  entry: ['src/index.ts', 'src/styles.css'],
  format: ['esm'],
  target: 'browser',
  dts: true,
  minify: true,
  sourcemap: false,
  env: { NODE_ENV: 'production' },
  footer: '// built with love',
})
