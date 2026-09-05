import { TEXT_PRESETS } from '../presets'
import { COMP_OPTIONS, type PlaygroundConfig, TYPE_OPTIONS } from '../types'
import {
  Button,
  Field,
  Segmented,
  Select,
  Slider,
  TextArea,
  TextInput,
  Toggle,
} from './controls'

interface ControlPanelProps {
  config: PlaygroundConfig
  onChange: (patch: Partial<PlaygroundConfig>) => void
  onReplay: () => void
}

export function ControlPanel({
  config,
  onChange,
  onReplay,
}: ControlPanelProps) {
  const charCount = [...config.text].length

  return (
    <aside className="dock">
      <div className="dock__head">
        <span className="eyebrow">Controls</span>
        <span className="dock__hint">live</span>
      </div>

      <Field
        id="text"
        label="Text"
        value={`${charCount} char${charCount === 1 ? '' : 's'}`}
        description="Newlines and tabs are preserved. Change this to watch one string morph into the next."
      >
        <TextArea
          id="text"
          value={config.text}
          onChange={(text) => onChange({ text })}
        />
        <fieldset className="chips" aria-label="Text presets">
          {TEXT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="chip"
              aria-pressed={preset.text === config.text}
              onClick={() => onChange({ text: preset.text })}
            >
              {preset.label}
            </button>
          ))}
        </fieldset>
      </Field>

      <Field
        id="speed"
        label="Speed"
        value={`${config.animationSpeed}ms`}
        description="Milliseconds between frames. Lower is faster."
      >
        <Slider
          id="speed"
          min={10}
          max={300}
          step={5}
          value={config.animationSpeed}
          onChange={(animationSpeed) => onChange({ animationSpeed })}
        />
      </Field>

      <Field id="type" label="Type" value={config.type}>
        <Segmented
          id="type"
          options={TYPE_OPTIONS}
          value={config.type}
          onChange={(type) => onChange({ type })}
        />
      </Field>

      <div className="field field--inline">
        <div className="field__head">
          <span className="eyebrow" id="keep-label">
            Keep correct chars
          </span>
          <Toggle
            id="keep"
            checked={config.keepCorrectChars}
            onChange={(keepCorrectChars) => onChange({ keepCorrectChars })}
          />
        </div>
        <p className="field__desc">
          On a text change, leave already-correct characters in place instead of
          re-scrambling them.
        </p>
      </div>

      <Field id="comp" label="Element" value={config.comp}>
        <Select
          id="comp"
          options={COMP_OPTIONS}
          value={config.comp}
          onChange={(comp) => onChange({ comp })}
        />
      </Field>

      <Field id="class" label="Class name" value={config.className || '—'}>
        <TextInput
          id="class"
          value={config.className}
          placeholder="add a CSS class"
          onChange={(className) => onChange({ className })}
        />
      </Field>

      <Button onClick={onReplay} variant="primary">
        Replay animation
      </Button>
    </aside>
  )
}
