import { useEffect, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { ControlPanel } from './components/control-panel'
import { Segmented } from './components/controls'
import { PreviewStage } from './components/preview-stage'
import {
  DEFAULT_CONFIG,
  type PlaygroundConfig,
  THEME_OPTIONS,
  type ThemeChoice,
} from './types'

import './styles.css'

export function App() {
  const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_CONFIG)
  const [replayNonce, setReplayNonce] = useState(0)
  const [theme, setTheme] = useLocalStorage<ThemeChoice>(
    'textimation:theme',
    'system',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function update(patch: Partial<PlaygroundConfig>) {
    setConfig((current) => ({ ...current, ...patch }))
  }

  // Remounting the preview is how we replay the animation. The component only
  // re-animates on a text change or on intersection, so changing speed, type,
  // keepCorrectChars, or the element won't otherwise be visible — folding them
  // into the key gives a fresh run on every such change. Text is deliberately
  // excluded so a text change morphs from the previous string instead of
  // restarting; the replay nonce lets the Replay button force a run on demand.
  const previewKey = [
    config.animationSpeed,
    config.type,
    config.keepCorrectChars,
    config.comp,
    replayNonce,
  ].join(':')

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">textimation</span>
          <span className="brand__sub">component playground</span>
        </div>
        <div className="topbar__actions">
          <div className="theme">
            <span className="eyebrow" id="theme-label">
              Theme
            </span>
            <Segmented
              id="theme"
              options={THEME_OPTIONS}
              value={theme}
              onChange={setTheme}
            />
          </div>
          <a
            className="repo-link"
            href="https://github.com/TheeKia/textimation"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      <div className="layout">
        <ControlPanel
          config={config}
          onChange={update}
          onReplay={() => setReplayNonce((nonce) => nonce + 1)}
        />
        <PreviewStage config={config} previewKey={previewKey} />
      </div>
    </div>
  )
}
