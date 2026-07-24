import { useT } from '../lib/i18n'
import { SyncPanel, SyncProp } from './SyncPanel'

interface Props {
  sync: SyncProp
  onBack: () => void
}

export function SyncSettingsPage({ sync, onBack }: Props) {
  const t = useT()

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('sync')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      <SyncPanel sync={sync} />

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
