import { useRef, useState } from 'react'
import { Profile, Recurring, Settings } from '../lib/types'
import { Theme } from '../lib/theme'
import { CURRENCIES } from '../lib/currencies'
import { fileToAvatar } from '../lib/image'
import { SyncStatus } from '../lib/useSync'
import { RecurringBills } from './RecurringBills'

interface Props {
  settings: Settings
  profile: Profile
  recurring: Recurring[]
  theme: Theme
  sync: { status: SyncStatus; configured: boolean; syncNow: () => void; lastError: string }
  onSettings: (s: Settings) => void
  onProfile: (p: Profile) => void
  onAddRecurring: (input: Omit<Recurring, 'id' | 'createdAt'>) => void
  onUpdateRecurring: (id: string, patch: Partial<Recurring>) => void
  onDeleteRecurring: (id: string) => void
  onTheme: (t: Theme) => void
  onExport: () => void
  onImport: (file: File) => void
  onClear: () => void
  onBack: () => void
}

const THEMES: Theme[] = ['system', 'light', 'dark']

const SYNC_LABEL: Record<SyncStatus, string> = {
  off: 'Local only',
  connecting: 'Connecting…',
  syncing: 'Syncing…',
  synced: 'Synced',
  error: 'Sync error',
}

export function SettingsPage({
  settings,
  profile,
  recurring,
  theme,
  sync,
  onSettings,
  onProfile,
  onAddRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
  onTheme,
  onExport,
  onImport,
  onClear,
  onBack,
}: Props) {
  const [budget, setBudget] = useState(String(settings.monthlyBudget))
  const [name, setName] = useState(profile.name ?? '')
  const [warnPct, setWarnPct] = useState(String(Math.round(settings.warnThreshold * 100)))
  const [resetDay, setResetDay] = useState(String(settings.resetDay))
  const avatarInput = useRef<HTMLInputElement>(null)
  const importInput = useRef<HTMLInputElement>(null)

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
  function commitName() {
    onProfile({ ...profile, name: name.trim() || undefined })
  }

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await fileToAvatar(file)
      onProfile({ ...profile, avatar: data })
    } catch {
      /* ignore bad image */
    }
  }

  const initial = (profile.name?.trim()?.[0] || 'M').toUpperCase()

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">Settings</div>
          <span className="month">Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>Done</button>
      </header>

      {/* Profile */}
      <section className="setting-block">
        <div className="profile-row">
          <button
            className="avatar avatar-lg"
            onClick={() => avatarInput.current?.click()}
            aria-label="Change avatar"
          >
            {profile.avatar ? <img src={profile.avatar} alt="" /> : <span>{initial}</span>}
          </button>
          <div className="profile-fields">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="flabel" htmlFor="name">Your name</label>
              <input
                id="name"
                placeholder="optional"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitName}
              />
            </div>
            <div className="avatar-actions">
              <button className="link" onClick={() => avatarInput.current?.click()}>
                {profile.avatar ? 'Change photo' : 'Add photo'}
              </button>
              {profile.avatar && (
                <button className="link danger" onClick={() => onProfile({ ...profile, avatar: undefined })}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <input
          ref={avatarInput}
          type="file"
          accept="image/*"
          onChange={pickAvatar}
          style={{ display: 'none' }}
        />
      </section>

      {/* Budget */}
      <section className="setting-block">
        <p className="section-head">Budget</p>
        <div className="field">
          <label className="flabel" htmlFor="s-budget">Monthly budget</label>
          <input
            id="s-budget"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            onBlur={commitBudget}
          />
        </div>

        <p className="flabel">Currency</p>
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
            <label className="flabel" htmlFor="s-warn">Warn at % left</label>
            <input
              id="s-warn"
              inputMode="numeric"
              value={warnPct}
              onChange={(e) => setWarnPct(e.target.value)}
              onBlur={commitWarn}
            />
          </div>
          <div className="field">
            <label className="flabel" htmlFor="s-reset">Cycle resets on day</label>
            <input
              id="s-reset"
              inputMode="numeric"
              value={resetDay}
              onChange={(e) => setResetDay(e.target.value)}
              onBlur={commitResetDay}
            />
          </div>
        </div>
        <p className="muted" style={{ marginTop: -4 }}>
          Set this to your payday (e.g. 15) and each month runs 15th → 14th.
        </p>
      </section>

      <RecurringBills
        currency={settings.currency}
        recurring={recurring}
        onAdd={onAddRecurring}
        onUpdate={onUpdateRecurring}
        onDelete={onDeleteRecurring}
      />

      {/* Appearance */}
      <section className="setting-block">
        <p className="section-head">Appearance</p>
        <div className="theme-row">
          {THEMES.map((t) => (
            <button key={t} className={`cat ${theme === t ? 'active' : ''}`} onClick={() => onTheme(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Sync */}
      <section className="setting-block">
        <p className="section-head">Sync</p>
        <div className="row" style={{ borderBottom: 'none', padding: '4px 0' }}>
          <div className="r-text">
            <div className="r-title" style={{ fontSize: 15 }}>{SYNC_LABEL[sync.status]}</div>
            <div className="r-sub">
              {sync.configured
                ? sync.status === 'error'
                  ? sync.lastError
                  : 'Synced across your devices via LeanCloud.'
                : 'Add LeanCloud keys to sync across devices.'}
            </div>
          </div>
          {sync.configured && (
            <button className="link" onClick={sync.syncNow}>Sync now</button>
          )}
        </div>
      </section>

      {/* Data */}
      <section className="setting-block">
        <p className="section-head">Data</p>
        <div className="two">
          <button className="btn btn-ghost" onClick={onExport}>Export backup</button>
          <button className="btn btn-ghost" onClick={() => importInput.current?.click()}>
            Import
          </button>
        </div>
        <input
          ref={importInput}
          type="file"
          accept="application/json"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImport(f)
            e.target.value = ''
          }}
          style={{ display: 'none' }}
        />
        <button
          className="btn btn-ghost danger-btn"
          style={{ marginTop: 12 }}
          onClick={onClear}
        >
          Clear all data
        </button>
      </section>

      <footer className="footer">Margin · Room to spend</footer>
    </div>
  )
}
