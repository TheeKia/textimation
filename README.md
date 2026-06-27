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
| `animationSpeed` | `number` | `50` | Milliseconds between character changes — lower is faster. |
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

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT License
