# @textimation/svelte

A Svelte 5 text scramble component. Characters shuffle through random glyphs
before settling on the target text, starting when the wrapper enters the
viewport. Text changes animate while visible or already animating; updates to
a settled offscreen instance wait for re-entry.

The implementation is available in this workspace. The package remains private
and is **not published to npm**; naming, versioning, and its release workflow
must be finalized before publishing. Requires Svelte **5.29+** for DOM
[attachments](https://svelte.dev/docs/svelte/@attach).

## Usage

```svelte
<script lang="ts">
  import { Textimation } from '@textimation/svelte'
  import '@textimation/svelte/styles.css'

  let text = $state('Hello from Svelte!')
</script>

<Textimation {text} Comp="p" animationSpeed={30} keepCorrectChars class="headline" />
<button onclick={() => (text = 'Ready to ship 🚀')}>Change text</button>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | Required | Target text; updates interrupt a running animation using the currently displayed characters. |
| `animationSpeed` | `number` | `50` | Target milliseconds per logic step. Finite values below `1` use `1ms`; `NaN` and infinities fall back to `50ms`. Changes take effect on the next frame. |
| `type` | `'random'` or `'incremental'` | `'random'` | Similar scramble durations per character, or roughly left-to-right settling. Applied at the next animation start. |
| `keepCorrectChars` | `boolean` | `false` | Keep displayed characters that already match the next target. Applied at the next animation start. |
| `Comp` | `TextimationTag` | `'span'` | HTML wrapper tag. Changing it resets the instance's visual animation. |
| `class` | `string` | — | Wrapper class using Svelte's native spelling. |
| `className` | `string` | — | React-compatible alias; combined with `class` if both are supplied. |

`TextimationTag` supports `span`, `p`, `div`, `h1`–`h6`, `strong`, `em`, `code`,
`pre`, and `label`. Custom components and arbitrary DOM attributes are not
supported; use a surrounding element when needed. The package exports the
`TextimationProps`, `AnimationType`, and `TextimationTag` types.

Changing tuning props alone does not replay a completed target. To replay
unchanged text, remount it with Svelte's `{#key replay}` block and change
`replay`. Scrolling away and back also does not replay a completed target.

## Styling and accessibility

The optional CSS import defines `.textimation-correctChar` (opacity `1`) and
`.textimation-incorrectChar` (opacity `0.2`), with opacity transitions. Override
these classes or supply your own styles. Character spans remain stable during
an animation and are replaced with plain text at completion; style the wrapper
for persistent typography.

- The visual scramble is `aria-hidden`; a separate visually hidden span always
  contains the current target text. It is not a live region.
- Reduced motion is checked at each animation start. When requested, text
  appears immediately after the visibility gate opens. Preference changes do
  not interrupt an existing animation.
- SSR includes transparent layout text and the accessible target. Hydration
  starts observation; without JavaScript the visual text stays transparent.
  If `IntersectionObserver` is unavailable, the client displays the target
  immediately without scrambling.
- Animation uses `requestAnimationFrame`, with at most 250ms of elapsed time
  and 10 logic steps processed per tick after a delay. Scrolling offscreen
  does not stop a running animation. Unmounting cancels it and disconnects
  observation.
- Text is indexed by Unicode code point. Emoji sequences containing multiple
  code points (ZWJ, flags, modifiers) may split while scrambling. Use monospace
  fonts for stable glyph widths; proportional fonts and wide emoji can shift.
- Spaces, tabs, and newlines retain their layout through `white-space: pre-wrap`;
  they are revealed immediately on the initial run.

## Development and verification

Run from the repository root:

```bash
bun install
bun run dev:svelte
# One-time browser setup:
bunx playwright install chromium
bun run check
```

The playground runs at port 3042 and resolves source directly. Its controls
exercise live speed changes, text interruptions, both strategies, locking,
wrapper changes, replay, and a scroll-trigger example.

Pure helpers and their unit tests live in `packages/core`. Both framework
packages bundle that private workspace; consumers need no core dependency.
Svelte's build runs `svelte-package`, then bunup bundles the internal helper
bridge and declarations. The export map includes `types`, `svelte`, and
`default` conditions, plus `./styles.css`. No SvelteKit runtime is required.

- `bun run --cwd packages/svelte dev`: start the source playground.
- `bun run --cwd packages/svelte build`: generate `dist/` and bundle helpers.
- `bun run --cwd packages/svelte type-check`: TypeScript/Svelte diagnostics;
  warnings fail.
- `bun run check:packages`: validate built package exports, client/server
  compilation, CSS, and absence of private core imports. Build first.
- `bun run test:browser`: Chromium lifecycle and hydration tests against built
  Svelte output. Build first; tests start their own Vite fixture server.
- `bun run check`: lint, types, unit tests, library and playground builds,
  package validation, and browser tests.

Existing `v*` release tags publish only React. Svelte stays private until a
separate release tag pattern and publish job are configured.
