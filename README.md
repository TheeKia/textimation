# textimation

A simple React component for animating text with typewriter-like effects.

## Installation

```bash
bun add textimation
```

## Usage

First, import the styles and the `AnimatedText` component:

- You can use `.textimation-incorrectChar` to style the incorrect characters.
- You can use `.textimation-correctChar` to style the correct characters.

```css
.textimation-correctChar {
	transition: all 0.2s ease-in-out;
	opacity: 1;
}

.textimation-incorrectChar {
	transition: all 0.2s ease-in-out;
	opacity: 0.2;
}
```

```tsx
import 'textimation/styles.css';
import { AnimatedText } from 'textimation';

function App() {
	return (
		<AnimatedText
			text="Hello, world!"
			Comp="p"
			animationSpeed={30}
			keepCorrectChars
		/>
	);
}
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT License
