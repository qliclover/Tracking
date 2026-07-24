import { ReactNode } from 'react'
import { Category, Profile, Recurring, Settings } from '../lib/types'
import { Theme } from '../lib/theme'
import { money } from '../lib/format'
import { useT } from '../lib/i18n'
import { SyncProp } from './SyncPanel'

interface Props {
  settings: Settings
  profile: Profile
  categories: Category[]
  recurring: Recurring[]
  theme: Theme
  sync: SyncProp
  onOpenProfile: () => void
  onOpenBudget: () => void
  onOpenCategories: () => void
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
  onOpenProfile,
  onOpenBudget,
  onOpenCategories,
  onOpenFixedBills,
  onOpenAppearance,
  onOpenSync,
  onOpenData,
  onBack,
}: Props) {
  const t = useT()
  const initial = (profile.name?.trim()?.[0] || '余').toUpperCase()

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

      <section className="setting-block">
        <NavRow
          title={t('budget')}
          subtitle={`${money(settings.monthlyBudget, settings.currency)} · ${t('resets_on_day', { v: settings.resetDay })}`}
          onClick={onOpenBudget}
        />
        <NavRow
          title={t('manage_categories')}
          subtitle={t('category_count', { v: categories.length })}
          onClick={onOpenCategories}
        />
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
