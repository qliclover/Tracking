import { useRef, useState } from 'react'
import { Profile, Recurring, Settings } from '../lib/types'
import { Theme } from '../lib/theme'
import { CURRENCIES } from '../lib/currencies'
import { fileToAvatar } from '../lib/image'
import { SyncStatus } from '../lib/useSync'
import { useT, Lang } from '../lib/i18n'
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

const THEMES: { key: Theme; tk: string }[] = [
  { key: 'system', tk: 'theme_system' },
  { key: 'light', tk: 'theme_light' },
  { key: 'dark', tk: 'theme_dark' },
]

const SYNC_TK: Record<SyncStatus, string> = {
  off: 'sync_off',
  connecting: 'sync_connecting',
  syncing: 'sync_syncing',
  synced: 'sync_synced',
  error: 'sync_error',
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
  const t = useT()
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
      onProfile({ ...profile, avatar: await fileToAvatar(file) })
    } catch {
      /* ignore */
    }
  }

  const initial = (profile.name?.trim()?.[0] || '余').toUpperCase()

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('settings')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      {/* Profile */}
      <section className="setting-block">
        <div className="profile-row">
          <button className="avatar avatar-lg" onClick={() => avatarInput.current?.click()}>
            {profile.avatar ? <img src={profile.avatar} alt="" /> : <span>{initial}</span>}
          </button>
          <div className="profile-fields">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="flabel" htmlFor="name">{t('your_name')}</label>
              <input
                id="name"
                placeholder={t('optional')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitName}
              />
            </div>
            <div className="avatar-actions">
              <button className="link" onClick={() => avatarInput.current?.click()}>
                {profile.avatar ? t('change_photo') : t('add_photo')}
              </button>
              {profile.avatar && (
                <button className="link danger" onClick={() => onProfile({ ...profile, avatar: undefined })}>
                  {t('remove')}
                </button>
              )}
            </div>
          </div>
        </div>
        <input ref={avatarInput} type="file" accept="image/*" onChange={pickAvatar} style={{ display: 'none' }} />
      </section>

      {/* Budget */}
      <section className="setting-block">
        <p className="section-head">{t('budget')}</p>
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

      <RecurringBills
        currency={settings.currency}
        recurring={recurring}
        onAdd={onAddRecurring}
        onUpdate={onUpdateRecurring}
        onDelete={onDeleteRecurring}
      />

      {/* Appearance + language */}
      <section className="setting-block">
        <p className="section-head">{t('appearance')}</p>
        <div className="theme-row">
          {THEMES.map((th) => (
            <button key={th.key} className={`cat ${theme === th.key ? 'active' : ''}`} onClick={() => onTheme(th.key)}>
              {t(th.tk)}
            </button>
          ))}
        </div>

        <p className="flabel" style={{ marginTop: 18 }}>{t('language')}</p>
        <div className="theme-row">
          {(['zh', 'en'] as Lang[]).map((lg) => (
            <button
              key={lg}
              className={`cat ${settings.lang === lg ? 'active' : ''}`}
              onClick={() => onSettings({ ...settings, lang: lg })}
            >
              {lg === 'zh' ? '中文' : 'English'}
            </button>
          ))}
        </div>
      </section>

      {/* Sync */}
      <section className="setting-block">
        <p className="section-head">{t('sync')}</p>
        <div className="row" style={{ borderBottom: 'none', padding: '4px 0' }}>
          <div className="r-text">
            <div className="r-title" style={{ fontSize: 15 }}>{t(SYNC_TK[sync.status])}</div>
            <div className="r-sub">
              {sync.configured
                ? sync.status === 'error'
                  ? sync.lastError
                  : t('sync_desc_on')
                : t('sync_desc_off')}
            </div>
          </div>
          {sync.configured && <button className="link" onClick={sync.syncNow}>{t('sync_now')}</button>}
        </div>
      </section>

      {/* Data */}
      <section className="setting-block">
        <p className="section-head">{t('data')}</p>
        <div className="two">
          <button className="btn btn-ghost" onClick={onExport}>{t('export_backup')}</button>
          <button className="btn btn-ghost" onClick={() => importInput.current?.click()}>{t('import')}</button>
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
        <button className="btn btn-ghost danger-btn" style={{ marginTop: 12 }} onClick={onClear}>
          {t('clear_all')}
        </button>
      </section>

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
