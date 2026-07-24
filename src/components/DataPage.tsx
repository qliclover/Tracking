import { useRef } from 'react'
import { useT } from '../lib/i18n'

interface Props {
  onExport: () => void
  onImport: (file: File) => void
  onClear: () => void
  onBack: () => void
}

export function DataPage({ onExport, onImport, onClear, onBack }: Props) {
  const t = useT()
  const importInput = useRef<HTMLInputElement>(null)

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('data')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      <section className="setting-block">
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
