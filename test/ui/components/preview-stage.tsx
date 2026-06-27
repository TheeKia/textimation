import { useState } from 'react'
import { type PlaygroundConfig, Textimation } from '../types'
import { CodeSnippet } from './code-snippet'

interface PreviewStageProps {
  config: PlaygroundConfig
  /** Changing this remounts the live instance to replay the animation. */
  previewKey: string
}

export function PreviewStage({ config, previewKey }: PreviewStageProps) {
  const [showGuide, setShowGuide] = useState(true)
  const [showScroll, setShowScroll] = useState(false)

  const previewClassName = config.className
    ? `preview-text ${config.className}`
    : 'preview-text'

  return (
    <section className="stage">
      <div className="stage__head">
        <span className="eyebrow">Preview</span>
        <fieldset className="stage__aids" aria-label="Preview aids">
          <button
            type="button"
            className="aid"
            aria-pressed={showGuide}
            onClick={() => setShowGuide((value) => !value)}
          >
            Layout-shift guide
          </button>
          <button
            type="button"
            className="aid"
            aria-pressed={showScroll}
            onClick={() => setShowScroll((value) => !value)}
          >
            Scroll-trigger test
          </button>
        </fieldset>
      </div>

      <div className={`viewport${showGuide ? ' viewport--guide' : ''}`}>
        <div className="viewport__marks" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="viewport__inner">
          <Textimation
            key={previewKey}
            text={config.text}
            Comp={config.comp}
            animationSpeed={config.animationSpeed}
            type={config.type}
            keepCorrectChars={config.keepCorrectChars}
            className={previewClassName}
          />
        </div>
        {showGuide && (
          <p className="viewport__reference">
            Anchored beneath the animation. If this never jumps, the component
            is reserving its final size correctly.
          </p>
        )}
      </div>

      <CodeSnippet config={config} />

      {showScroll && <ScrollTest config={config} />}
    </section>
  )
}

function ScrollTest({ config }: { config: PlaygroundConfig }) {
  return (
    <div className="scrolltest">
      <p className="scrolltest__hint">
        The instance below starts off-screen. Scroll it into view to watch the
        IntersectionObserver kick off the animation.
      </p>
      <div className="scrolltest__spacer" aria-hidden="true">
        <span className="eyebrow">keep scrolling</span>
      </div>
      <div className="scrolltest__target">
        <Textimation
          text={config.text}
          Comp={config.comp}
          animationSpeed={config.animationSpeed}
          type={config.type}
          keepCorrectChars={config.keepCorrectChars}
          className="preview-text"
        />
      </div>
    </div>
  )
}
