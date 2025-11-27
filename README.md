# textimation

A simple React component for animating text with typewriter-like effects.

## Installation

```bash
bun add textimation
```

## Usage

First, import the styles and the `AnimatedText` component:

- You can use `.textimation-incorrectChar` to style the incorrect characters.

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
