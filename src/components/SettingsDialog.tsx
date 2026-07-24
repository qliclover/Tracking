import { FormEvent, useState } from 'react'
import { Settings } from '../lib/types'
import { Theme } from '../lib/theme'

interface Props {
  settings: Settings
  theme: Theme
  onSave: (s: Settings) => void
  onThemeChange: (t: Theme) => void
  onClose: () => void
}

const CURRENCIES = ['$', '€', '£', '¥', '₩', '₹']
const THEMES: Theme[] = ['system', 'light', 'dark']

export function SettingsDialog({ settings, theme, onSave, onThemeChange, onClose }: Props) {
  const [budget, setBudget] = useState(String(settings.monthlyBudget))
  const [currency, setCurrency] = useState(settings.currency)
  const [warnPct, setWarnPct] = useState(String(Math.round(settings.warnThreshold * 100)))

  function submit(e: FormEvent) {
    e.preventDefault()
    const b = Number(budget)
    const w = Number(warnPct)
    onSave({
      monthlyBudget:
        Number.isFinite(b) && b >= 0 ? Math.round(b * 100) / 100 : settings.monthlyBudget,
      currency: currency || '$',
      warnThreshold: Number.isFinite(w)
        ? Math.min(0.9, Math.max(0, w / 100))
        : settings.warnThreshold,
    })
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <form onSubmit={submit}>
          <div className="field">
            <label className="flabel" htmlFor="s-budget">Monthly budget</label>
            <input
              id="s-budget"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              autoFocus
            />
          </div>

          <p className="flabel">Currency</p>
          <div className="cat-grid">
            {CURRENCIES.map((c) => (
              <button
                type="button"
                key={c}
                className={`cat ${currency === c ? 'active' : ''}`}
                onClick={() => setCurrency(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="field">
            <label className="flabel" htmlFor="s-warn">Warn when % of budget is left</label>
            <input
              id="s-warn"
              inputMode="numeric"
              value={warnPct}
              onChange={(e) => setWarnPct(e.target.value)}
            />
          </div>

          <p className="flabel">Appearance</p>
          <div className="theme-row">
            {THEMES.map((t) => (
              <button
                type="button"
                key={t}
                className={`cat ${theme === t ? 'active' : ''}`}
                onClick={() => onThemeChange(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="sheet-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
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
