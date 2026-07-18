# textimation

A tiny React component that animates text with a typewriter / scramble effect:
characters shuffle through random glyphs before settling on the final string.
It animates the first time it scrolls into view, and re-animates whenever the
`text` prop changes.

## Installation

```bash
npm install textimation
# or: bun add textimation · pnpm add textimation · yarn add textimation
```

React 18 or 19 is required (peer dependency).

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
| `text` | `string` | _(required)_ | The text to animate to. Changing it re-runs the animation. |
| `animationSpeed` | `number` | `50` | Milliseconds between character changes — lower is faster. Timing is frame-accurate (`requestAnimationFrame`-driven); `0` means "as fast as possible", bounded per display frame. |
| `type` | `'random'` or `'incremental'` | `'random'` | `random` scrambles every character for a similar duration; `incremental` settles characters roughly left-to-right. |
| `keepCorrectChars` | `boolean` | `false` | On text changes, leave already-correct characters untouched instead of re-scrambling them. |
| `Comp` | `ElementType` | `'span'` | The wrapper element/component to render (e.g. `'p'`, `'h1'`). |
| `className` | `string` | — | Class applied to the wrapper element. |

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
classes yourself.

## Design notes

- **Monospace fonts.** The effect is designed for monospace fonts, where every
  scramble glyph has the same width. In a variable-width font the text will
  jitter horizontally while scrambling — that's an accepted tradeoff, not a
  bug; there is no per-character width reservation.
- **Reduced motion.** When the user's system sets
  `prefers-reduced-motion: reduce`, the scramble is skipped entirely and the
  final text appears immediately. This is checked at the start of each
  animation; there is no prop to override it.
- **Background tabs.** The animation is `requestAnimationFrame`-driven, so it
  pauses in hidden tabs and resumes on focus without a catch-up burst.
- **Unicode.** Text is split by code points, so surrogate-pair characters like
  emoji animate as single units. Multi-code-point grapheme clusters (ZWJ
  sequences such as 👨‍👩‍👧, flags, skin-tone modifiers) still split into their
  components while animating — a known limitation. Note that emoji are usually
  double-width even in monospace fonts, so expect minor width wobble on those
  slots.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT License
