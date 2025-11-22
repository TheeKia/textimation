import './styles.css'

import { AnimatedText } from '../../src'

export function App() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <AnimatedText
        text="Hello, world!"
        Comp="p"
        animationSpeed={30}
        keepCorrectChars
      />
    </main>
  )
}
