import { useState } from 'react'
import { Textimation } from '../../src'

import './styles.css'

const texts = [
  'Hello, world! This is a longer text that should be animated correctly.',
  'H3ll0, w0rld! Th1s 15 4 l0ng3r t3xt th4t sh0uld b3 anim4t3d c0rr3ctly.',
  'This is a third text that should be animated correctly.',
  'This is a fourth text that should be animated correctly.',
  'This is a fifth text that should be animated correctly.',
]

export function App() {
  const [index, setIndex] = useState(0)

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div>
        <Textimation
          text={texts[index]}
          Comp="p"
          animationSpeed={80}
          keepCorrectChars
          type="incremental"
        />
        <p>Testing layout shift</p>
      </div>
      <button
        type="button"
        onClick={() => setIndex((index) => (index + 1) % texts.length)}
      >
        Change text
      </button>
      <Textimation
        text="Hello, world!"
        Comp="p"
        animationSpeed={50}
        keepCorrectChars
      />
    </main>
  )
}
