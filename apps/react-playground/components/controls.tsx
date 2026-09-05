import type { CSSProperties, ReactNode } from 'react'

/**
 * A labelled control row in the dock. The head carries a mono eyebrow on the
 * left and a live value readout on the right — the "instrument panel" motif.
 * Controls are wired to the eyebrow via `aria-labelledby={`${id}-label`}`.
 */
interface FieldProps {
  id: string
  label: string
  value?: string
  description?: string
  children: ReactNode
}

export function Field({ id, label, value, description, children }: FieldProps) {
  return (
    <div className="field">
      <div className="field__head">
        <span className="eyebrow" id={`${id}-label`}>
          {label}
        </span>
        {value !== undefined && <span className="readout">{value}</span>}
      </div>
      {children}
      {description && <p className="field__desc">{description}</p>}
    </div>
  )
}

interface Option<T extends string> {
  label: string
  value: T
}

interface SliderProps {
  id: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
}

export function Slider({
  id,
  min,
  max,
  step = 1,
  value,
  onChange,
}: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <input
      id={id}
      className="slider"
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-labelledby={`${id}-label`}
      style={{ '--fill': `${fill}%` } as CSSProperties}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  )
}

interface ToggleProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ id, checked, onChange }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-label`}
      className="toggle"
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__thumb" />
    </button>
  )
}

interface SegmentedProps<T extends string> {
  id: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export function Segmented<T extends string>({
  id,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <fieldset className="segmented" aria-labelledby={`${id}-label`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="segmented__option"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  )
}

interface SelectProps<T extends string> {
  id: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export function Select<T extends string>({
  id,
  options,
  value,
  onChange,
}: SelectProps<T>) {
  return (
    <div className="select">
      <select
        id={id}
        className="select__input"
        value={value}
        aria-labelledby={`${id}-label`}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="select__chevron" aria-hidden="true">
        ⌄
      </span>
    </div>
  )
}

interface TextAreaProps {
  id: string
  value: string
  onChange: (value: string) => void
}

export function TextArea({ id, value, onChange }: TextAreaProps) {
  return (
    <textarea
      id={id}
      className="textarea"
      rows={3}
      spellCheck={false}
      value={value}
      aria-labelledby={`${id}-label`}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

interface TextInputProps {
  id: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export function TextInput({
  id,
  value,
  placeholder,
  onChange,
}: TextInputProps) {
  return (
    <input
      id={id}
      className="text-input"
      type="text"
      spellCheck={false}
      value={value}
      placeholder={placeholder}
      aria-labelledby={`${id}-label`}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

interface ButtonProps {
  onClick: () => void
  children: ReactNode
  variant?: 'primary' | 'ghost'
}

export function Button({ onClick, children, variant = 'ghost' }: ButtonProps) {
  return (
    <button
      type="button"
      className={`button button--${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
