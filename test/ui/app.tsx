import './styles.css'

import { Textimation } from '../../src'

export function App() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <Textimation
        text="Hello, world!"
        Comp="p"
        animationSpeed={30}
        keepCorrectChars
      />
      <Textimation
        text="Hello, world!"
        Comp="p"
        animationSpeed={30}
        keepCorrectChars
      />
    </main>
  )
}
