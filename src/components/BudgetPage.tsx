import { useState } from 'react'
import { Settings } from '../lib/types'
import { CURRENCIES } from '../lib/currencies'
import { useT } from '../lib/i18n'

interface Props {
  settings: Settings
  onSettings: (s: Settings) => void
  onBack: () => void
}

export function BudgetPage({ settings, onSettings, onBack }: Props) {
  const t = useT()
  const [budget, setBudget] = useState(String(settings.monthlyBudget))
  const [warnPct, setWarnPct] = useState(String(Math.round(settings.warnThreshold * 100)))
  const [resetDay, setResetDay] = useState(String(settings.resetDay))

  function commitBudget() {
    const b = Number(budget)
    if (Number.isFinite(b) && b >= 0) onSettings({ ...settings, monthlyBudget: Math.round(b * 100) / 100 })
  }
  function commitWarn() {
    const w = Number(warnPct)
    if (Number.isFinite(w)) onSettings({ ...settings, warnThreshold: Math.min(0.9, Math.max(0, w / 100)) })
  }
  function commitResetDay() {
    const d = Number(resetDay)
    const clamped = Number.isFinite(d) ? Math.min(31, Math.max(1, Math.round(d))) : settings.resetDay
    setResetDay(String(clamped))
    onSettings({ ...settings, resetDay: clamped })
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('budget')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      <section className="setting-block">
        <div className="field">
          <label className="flabel" htmlFor="s-budget">{t('monthly_budget')}</label>
          <input id="s-budget" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} onBlur={commitBudget} />
        </div>

        <p className="flabel">{t('currency')}</p>
        <div className="cat-grid">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              className={`cat ${settings.currency === c.symbol ? 'active' : ''}`}
              onClick={() => onSettings({ ...settings, currency: c.symbol })}
            >
              {c.symbol} <span className="muted" style={{ fontSize: 12 }}>{c.code}</span>
            </button>
          ))}
        </div>

        <div className="two">
          <div className="field">
            <label className="flabel" htmlFor="s-warn">{t('warn_at')}</label>
            <input id="s-warn" inputMode="numeric" value={warnPct} onChange={(e) => setWarnPct(e.target.value)} onBlur={commitWarn} />
          </div>
          <div className="field">
            <label className="flabel" htmlFor="s-reset">{t('reset_on_day')}</label>
            <input id="s-reset" inputMode="numeric" value={resetDay} onChange={(e) => setResetDay(e.target.value)} onBlur={commitResetDay} />
          </div>
        </div>
        <p className="muted" style={{ marginTop: -4 }}>{t('reset_hint')}</p>
      </section>

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
