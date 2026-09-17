import { defineConfig } from 'bunup'

export default defineConfig({
  entry: ['src/internal/animation.ts'],
  outDir: 'dist/internal',
  clean: false,
  format: ['esm'],
  target: 'browser',
  noExternal: ['@textimation/core'],
  dts: { resolve: ['@textimation/core'] },
})
