import { ReactNode, useRef, useState } from 'react'
import { Category, Profile, Settings } from '../lib/types'
import { Theme } from '../lib/theme'
import { CURRENCIES } from '../lib/currencies'
import { useT, Lang } from '../lib/i18n'
import { SyncProp } from './SyncPanel'

interface Props {
  settings: Settings
  profile: Profile
  categories: Category[]
  theme: Theme
  sync: SyncProp
  onSettings: (s: Settings) => void
  onTheme: (t: Theme) => void
  onExport: () => void
  onImport: (file: File) => Promise<boolean>
  onClear: () => void
  onOpenProfile: () => void
  onOpenCategories: () => void
  onOpenSync: () => void
}

const THEMES: { key: Theme; tk: string }[] = [
  { key: 'system', tk: 'theme_system' },
  { key: 'light', tk: 'theme_light' },
  { key: 'dark', tk: 'theme_dark' },
]

function NavRow({ title, subtitle, avatar, onClick }: { title: string; subtitle?: string; avatar?: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className="row"
      style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '10px 0' }}
      onClick={onClick}
    >
      {avatar}
      <div className="r-text">
        <div className="r-title" style={{ fontSize: 15 }}>{title}</div>
        {subtitle && <div className="r-sub">{subtitle}</div>}
      </div>
      <span className="muted" style={{ fontSize: 18 }}>›</span>
    </button>
  )
}

export function SettingsPage({
  settings,
  profile,
  categories,
  theme,
  sync,
  onSettings,
  onTheme,
  onExport,
  onImport,
  onClear,
  onOpenProfile,
  onOpenCategories,
  onOpenSync,
}: Props) {
  const t = useT()
  const initial = (profile.name?.trim()?.[0] || '余').toUpperCase()
  const importInput = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState(false)

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

  const syncSubtitle = !sync.username
    ? t('not_signed_in')
    : sync.status === 'error'
      ? sync.lastError
      : sync.status === 'conflict'
        ? t('sync_conflict')
        : `${t(sync.status === 'synced' ? 'sync_synced' : sync.status === 'syncing' ? 'sync_syncing' : 'sync_connecting')} · ${sync.username}`

  return (
    <div className="page settings-v2">
      <header className="topbar">
        <div className="wordmark serif cjk">{t('settings')}</div>
      </header>

      <div className="settings-cards">
        <div className="card">
          <NavRow
            title={profile.name?.trim() || t('your_name')}
            subtitle={sync.username ? syncSubtitle : t('sync_desc_off')}
            avatar={
              <span className="avatar" style={{ width: 56, height: 56, marginRight: 14 }}>
                {profile.avatar ? <img src={profile.avatar} alt="" /> : <span style={{ fontSize: 26 }}>{initial}</span>}
              </span>
            }
            onClick={onOpenProfile}
          />
        </div>

        <div className="card card-tight">
          <div className="card-row">
            <span className="card-row-label">{t('monthly_budget')}</span>
            <input
              className="card-row-input serif"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              onBlur={commitBudget}
            />
          </div>
          <div className="card-row">
            <span className="card-row-label">{t('currency')}</span>
            <select
              className="card-row-select"
              value={settings.currency}
              onChange={(e) => onSettings({ ...settings, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.symbol}>{c.symbol} {c.code}</option>
              ))}
            </select>
          </div>
          <div className="card-row">
            <span className="card-row-label">{t('reset_on_day')}</span>
            <input
              className="card-row-input"
              inputMode="numeric"
              value={resetDay}
              onChange={(e) => setResetDay(e.target.value)}
              onBlur={commitResetDay}
            />
          </div>
          <div className="card-row card-row-last">
            <span className="card-row-label">{t('warn_at')}</span>
            <input
              className="card-row-input"
              inputMode="numeric"
              value={warnPct}
              onChange={(e) => setWarnPct(e.target.value)}
              onBlur={commitWarn}
            />
          </div>
        </div>

        <div className="card">
          <NavRow
            title={t('manage_categories')}
            subtitle={t('category_count', { v: categories.length })}
            onClick={onOpenCategories}
          />
        </div>

        <div className="card">
          <p className="lbl" style={{ marginBottom: 12 }}>{t('appearance')}</p>
          <div className="theme-row" style={{ marginBottom: 14 }}>
            {THEMES.map((th) => (
              <button key={th.key} className={`cat ${theme === th.key ? 'active' : ''}`} onClick={() => onTheme(th.key)}>
                {t(th.tk)}
              </button>
            ))}
          </div>
          <p className="lbl" style={{ marginBottom: 12 }}>{t('language')}</p>
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
        </div>

        <div className="card">
          <NavRow title={t('sync')} subtitle={syncSubtitle} onClick={onOpenSync} />
        </div>

        <div className="card card-tight">
          <button type="button" className="card-row card-row-action" onClick={onExport}>
            <span className="card-row-label">{t('export_backup')}</span>
            <span className="muted" style={{ fontSize: 16 }}>›</span>
          </button>
          <button type="button" className="card-row card-row-action" onClick={() => importInput.current?.click()}>
            <span className="card-row-label">{t('import')}</span>
            <span className="muted" style={{ fontSize: 16 }}>›</span>
          </button>
          <button type="button" className="card-row card-row-action card-row-last" onClick={onClear}>
            <span className="card-row-label" style={{ color: 'var(--danger)' }}>{t('clear_all')}</span>
            <span className="muted" style={{ fontSize: 16 }}>›</span>
          </button>
          <input
            ref={importInput}
            type="file"
            accept="application/json"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              setImportError(false)
              const ok = await onImport(f)
              if (!ok) setImportError(true)
            }}
            style={{ display: 'none' }}
          />
        </div>
        {importError && <p className="error">{t('import_bad')}</p>}

        <p className="settings-tagline">有余 · {t('tagline')}</p>
      </div>
    </div>
  )
}
