import { ReactNode, useState } from 'react'
import { Category, Profile, Recurring, Settings } from '../lib/types'
import { Theme } from '../lib/theme'
import { CURRENCIES } from '../lib/currencies'
import { useT } from '../lib/i18n'
import { SyncProp } from './SyncPanel'
import { CategoryManager } from './CategoryManager'

interface Props {
  settings: Settings
  profile: Profile
  categories: Category[]
  recurring: Recurring[]
  theme: Theme
  sync: SyncProp
  onSettings: (s: Settings) => void
  onAddCategory: (name: string) => void
  onRenameCategory: (oldName: string, newName: string) => void
  onDeleteCategory: (name: string) => void
  onOpenProfile: () => void
  onOpenFixedBills: () => void
  onOpenAppearance: () => void
  onOpenSync: () => void
  onOpenData: () => void
  onBack: () => void
}

const THEME_TK: Record<Theme, string> = {
  system: 'theme_system',
  light: 'theme_light',
  dark: 'theme_dark',
}

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
  recurring,
  theme,
  sync,
  onSettings,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onOpenProfile,
  onOpenFixedBills,
  onOpenAppearance,
  onOpenSync,
  onOpenData,
  onBack,
}: Props) {
  const t = useT()
  const initial = (profile.name?.trim()?.[0] || '余').toUpperCase()

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
      : `${t(sync.status === 'synced' ? 'sync_synced' : sync.status === 'syncing' ? 'sync_syncing' : 'sync_connecting')} · ${sync.username}`

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('settings')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      <section className="setting-block">
        <NavRow
          title={profile.name?.trim() || t('your_name')}
          avatar={
            <span className="avatar" style={{ width: 40, height: 40, marginRight: 12 }}>
              {profile.avatar ? <img src={profile.avatar} alt="" /> : <span>{initial}</span>}
            </span>
          }
          onClick={onOpenProfile}
        />
      </section>

      {/* Budget — inline */}
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

      {/* Categories — inline */}
      <CategoryManager categories={categories} onAdd={onAddCategory} onRename={onRenameCategory} onDelete={onDeleteCategory} />

      <section className="setting-block">
        <NavRow
          title={t('fixed_bills')}
          subtitle={t('bills_count', { v: recurring.length })}
          onClick={onOpenFixedBills}
        />
      </section>

      <section className="setting-block">
        <NavRow
          title={t('appearance')}
          subtitle={`${t(THEME_TK[theme])} · ${settings.lang === 'zh' ? '中文' : 'English'}`}
          onClick={onOpenAppearance}
        />
        <NavRow title={t('sync')} subtitle={syncSubtitle} onClick={onOpenSync} />
        <NavRow title={t('data')} onClick={onOpenData} />
      </section>

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
