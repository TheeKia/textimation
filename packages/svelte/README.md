# @textimation/svelte

Private Svelte 5 package scaffold. `Textimation` currently renders its `text`
prop as plain text. The animation and full public API are not implemented yet,
and this package is not published to npm.

## Current API

Inside this workspace, the only component prop is the required `text: string`:

```svelte
<script lang="ts">
  import { Textimation } from '@textimation/svelte'
</script>

<Textimation text="Hello from Svelte!" />
```

It renders `<span>{text}</span>`. React's animation props, scroll detection,
wrapper customization, and CSS classes are not implemented here. The
playground supplies its own typography and whitespace styling.

## Development

From the repository root:

```bash
bun install
bun run dev:svelte
```

Edit `src/Textimation.svelte` and export public components and types from
`src/index.ts`. The playground imports `@textimation/svelte` through a local
source alias, so edits appear immediately without rebuilding the package.
Use Svelte 5 runes for reactive component state.

The existing animation helpers and behavioral tests are in
`../react/src/lib` and `../react/test`. When porting the animation, extract shared
framework-independent behavior into a dedicated workspace rather than importing
React package internals or duplicating the algorithm.

## Tooling

- `bun run --cwd packages/svelte build` emits the library into `dist/`.
- `bun run --cwd packages/svelte type-check` checks TypeScript and Svelte,
  treating warnings as failures.
- `bun run build:playgrounds` verifies the production playground builds.
- `bun run lint` includes formatting for `.svelte` files via Prettier.
- `bun run check` runs the full workspace verification. There are currently no
  Svelte-specific unit or browser tests.

Packaging follows the [official Svelte library guidance](https://svelte.dev/docs/kit/packaging):
`@sveltejs/package` preserves preprocessed `.svelte` components for the consumer's
compiler and generates declarations. The export map includes `types`, `svelte`,
and `default` conditions. No SvelteKit runtime is required. Use `.js` extensions
for relative TypeScript module imports and `.svelte` for component imports.

Before the first release, implement and test the component, choose the public
package name/version, remove `private`, and add a separate Svelte release tag
and publish job. Existing `v*` tags only publish the React package.
