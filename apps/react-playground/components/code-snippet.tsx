import { useState } from 'react'
import type { PlaygroundConfig } from '../types'

/** Renders the minimal JSX needed to reproduce the current preview. */
function buildSnippet(config: PlaygroundConfig): string {
  const lines = ['<Textimation']
  lines.push(`  text={${JSON.stringify(config.text)}}`)
  if (config.comp !== 'span')
    lines.push(`  Comp=${JSON.stringify(config.comp)}`)
  if (config.animationSpeed !== 50) {
    lines.push(`  animationSpeed={${config.animationSpeed}}`)
  }
  if (config.type !== 'random')
    lines.push(`  type=${JSON.stringify(config.type)}`)
  if (config.keepCorrectChars) lines.push('  keepCorrectChars')
  if (config.className) {
    lines.push(`  className=${JSON.stringify(config.className)}`)
  }
  lines.push('/>')
  return lines.join('\n')
}

export function CodeSnippet({ config }: { config: PlaygroundConfig }) {
  const [copied, setCopied] = useState(false)
  const snippet = buildSnippet(config)

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <figure className="snippet">
      <figcaption className="snippet__head">
        <span className="eyebrow">Usage</span>
        <button type="button" className="snippet__copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="snippet__code">
        <code>{snippet}</code>
      </pre>
    </figure>
  )
}
