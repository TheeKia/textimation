import { defineConfig } from 'bumpp'

export default defineConfig({
  files: ['packages/react/package.json'],
  execute: 'bun install --lockfile-only',
  all: true,
  commit: true,
  tag: 'v{version}',
  push: true,
})
