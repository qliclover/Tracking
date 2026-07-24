import { Settings } from '../lib/types'
import { Theme } from '../lib/theme'
import { useT, Lang } from '../lib/i18n'

interface Props {
  settings: Settings
  theme: Theme
  onSettings: (s: Settings) => void
  onTheme: (t: Theme) => void
  onBack: () => void
}

const THEMES: { key: Theme; tk: string }[] = [
  { key: 'system', tk: 'theme_system' },
  { key: 'light', tk: 'theme_light' },
  { key: 'dark', tk: 'theme_dark' },
]

export function AppearancePage({ settings, theme, onSettings, onTheme, onBack }: Props) {
  const t = useT()

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('appearance')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

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

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
