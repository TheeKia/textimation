export interface TextPreset {
  id: string
  label: string
  text: string
}

/** Sample strings that each exercise a different edge of the animation. */
export const TEXT_PRESETS: TextPreset[] = [
  {
    id: 'greeting',
    label: 'Greeting',
    text: 'Hello, world!',
  },
  {
    id: 'multiline',
    label: 'Multiline + tabs',
    text: 'Decoding signal…\n\tindented line,\twith tabs\nand a third line.',
  },
  {
    id: 'leet',
    label: 'Leet / numbers',
    text: 'H3ll0 fr0m 4 5cr4mbl3d 5tr1ng — 0123456789 !@#$%&*',
  },
  {
    id: 'emoji',
    label: 'Emoji',
    text: 'ship it 🚀 with sparkles ✨ and a wave 👋',
  },
  {
    id: 'paragraph',
    label: 'Long paragraph',
    text: 'Textimation scrambles each character through random glyphs before every letter settles into its final, correct place — without ever shifting the layout around it.',
  },
]
