# textimation

A tiny React component that animates text with a typewriter / scramble effect:
characters shuffle through random glyphs before settling on the final string.
It starts when it enters the viewport and animates toward new `text` values.
Updates to a settled, offscreen instance wait until it enters the viewport again.

## Repository layout

This repository uses [Bun workspaces](https://bun.com/docs/pm/workspaces) with
independent framework packages and development playgrounds.

```text
packages/
  react/               # Published as textimation; existing React API
    src/
    test/
  svelte/              # @textimation/svelte; private scaffold for Svelte 5
    src/
apps/
  react-playground/    # Bun + React, port 3041
  svelte-playground/   # Vite + Svelte, port 3042
```

The Svelte package currently renders plain text; animation is still to be
implemented. See [its README](./packages/svelte/README.md) for the starting point.
React's animation helpers and unit tests remain in `packages/react` until the
Svelte implementation establishes which behavior should be shared.

```bash
bun install
bun run dev:react
bun run dev:svelte # in another terminal
bun run check      # lint, types, tests, builds, package exports/SSR/CSS checks
```

Use Bun 1.4.0 and Node.js 24.11+ within Node 24 to match CI. The root manifest
also allows Node `^22.18.0 || ^24.11.0 || >=26.0.0` and Bun `>=1.4.0`.
Install once at the repository root; all workspaces use the same `bun.lock`.
The root and playgrounds are private.

## React installation

```bash
npm install textimation
# or: bun add textimation · pnpm add textimation · yarn add textimation
```

React and React DOM 18 or 19 are required peer dependencies. The package ships
ES modules and TypeScript declarations; use it in a client-rendered React app
or a client component in a server-rendered framework.

## Usage

```tsx
import 'textimation/styles.css'
import { Textimation } from 'textimation'

function App() {
  return (
    <Textimation
      text="Hello, world!"
      Comp="p"
      animationSpeed={30}
      keepCorrectChars
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | _(required)_ | The target text. Changes animate while visible or already animating; otherwise they wait for intersection. |
| `animationSpeed` | `number` | `50` | Target milliseconds per logic step — lower is faster. Use a finite number; values below `1` use `1ms`. Display updates follow `requestAnimationFrame`, with at most 10 logic steps per tick. |
| `type` | `'random'` or `'incremental'` | `'random'` | `random` scrambles every character for a similar duration; `incremental` settles characters roughly left-to-right. |
| `keepCorrectChars` | `boolean` | `false` | On text changes, leave already-correct characters untouched instead of re-scrambling them. |
| `Comp` | `ElementType` | `'span'` | Wrapper element/component (e.g. `'p'`, `'h1'`). Custom components must forward the ref and render the supplied children, style, and className on a DOM element. |
| `className` | `string` | — | Class applied to the wrapper element. |

Changing `animationSpeed` takes effect on the next animation tick. `type` and
`keepCorrectChars` apply when the next animation starts. Changing these props
alone does not replay finished text. Scroll re-entry also does not replay an
unchanged, completed target; change the React `key` to force a fresh instance.
Keep `Comp` stable during an animation, or change the key when replacing it.

The package also exports the `TextimationProps` and `AnimationType` types:

```tsx
import type { AnimationType, TextimationProps } from 'textimation'
```

Only the listed props are supported; arbitrary DOM attributes and an external
ref are not forwarded. Use a surrounding element for additional attributes.

## Styling

Importing `textimation/styles.css` ships sensible defaults. While animating,
each character is wrapped in a `<span>` carrying one of two classes that you
can override:

- `.textimation-correctChar` — a character that has reached its final value.
- `.textimation-incorrectChar` — a character that is still scrambling.

```css
.textimation-correctChar {
  transition: opacity 0.2s ease-in-out;
  opacity: 1;
}

.textimation-incorrectChar {
  transition: opacity 0.2s ease-in-out;
  opacity: 0.2;
}
```

Prefer to ship your own styles? Skip the CSS import and define those two
classes yourself. The per-character spans are removed when an animation
finishes, leaving plain text; style the wrapper for persistent typography.

## Design notes

- **Browser and server rendering.** Animation needs client-side JavaScript,
  `IntersectionObserver`, and `requestAnimationFrame`. Server output includes
  the text, but the visual span stays transparent until the client starts the
  animation. There is no visible no-JavaScript or missing-observer fallback.
- **Accessibility.** The visual scramble is hidden from assistive technology;
  a separate visually hidden span contains the current target text. This is
  not a live region and does not request announcements on every update.
- **Monospace fonts.** The effect is designed for monospace fonts, where every
  scramble glyph has the same width. In a variable-width font the text will
  jitter horizontally while scrambling — that's an accepted tradeoff, not a
  bug; there is no per-character width reservation.
- **Reduced motion.** When the user's system sets
  `prefers-reduced-motion: reduce`, the scramble is skipped entirely and the
  final text appears when the animation would start, after the visibility
  gate opens. This is checked at each animation start; preference changes
  do not interrupt a running animation, and there is no override prop.
- **Background tabs.** The animation is `requestAnimationFrame`-driven, so it
  normally pauses in hidden tabs. On resume, elapsed-time catch-up is capped
  at 250ms and 10 logic steps per tick. Scrolling out of view does not pause
  an animation already running.
- **Unicode.** Text is split by code points, so surrogate-pair characters like
  emoji animate as single units. Multi-code-point grapheme clusters (ZWJ
  sequences such as 👨‍👩‍👧, flags, skin-tone modifiers) still split into their
  components while animating — a known limitation. Note that emoji are usually
  double-width even in monospace fonts, so expect minor width wobble on those
  slots.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development and verification, and
[AGENTS.md](./AGENTS.md) for repository guidance and code quality standards.

## License

MIT License
