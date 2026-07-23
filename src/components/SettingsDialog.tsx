import { FormEvent, useState } from 'react'
import { Settings } from '../lib/types'

interface Props {
  settings: Settings
  onSave: (s: Settings) => void
  onClose: () => void
}

const CURRENCIES = ['$', '€', '£', '¥', '₩', 'A$', 'C$']

export function SettingsDialog({ settings, onSave, onClose }: Props) {
  const [budget, setBudget] = useState(String(settings.monthlyBudget))
  const [currency, setCurrency] = useState(settings.currency)
  const [warnPct, setWarnPct] = useState(String(Math.round(settings.warnThreshold * 100)))

  function submit(e: FormEvent) {
    e.preventDefault()
    const b = Number(budget)
    const w = Number(warnPct)
    onSave({
      monthlyBudget: Number.isFinite(b) && b >= 0 ? Math.round(b * 100) / 100 : settings.monthlyBudget,
      currency: currency || '$',
      warnThreshold: Number.isFinite(w) ? Math.min(0.9, Math.max(0, w / 100)) : settings.warnThreshold,
    })
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="card dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Budget settings</h2>
        <form onSubmit={submit}>
          <label className="field">
            <span className="field-label">Monthly budget</span>
            <input
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field-label">Currency</span>
            <div className="chips">
              {CURRENCIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`chip ${currency === c ? 'chip-active' : ''}`}
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </label>

          <label className="field">
            <span className="field-label">Warn me when this % of budget is left</span>
            <input
              inputMode="numeric"
              value={warnPct}
              onChange={(e) => setWarnPct(e.target.value)}
            />
          </label>

          <div className="dialog-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
