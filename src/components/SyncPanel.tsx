import { FormEvent, useState } from 'react'
import { useT } from '../lib/i18n'
import { SyncStatus } from '../lib/useSync'

export interface SyncProp {
  status: SyncStatus
  configured: boolean
  email: string | null
  lastError: string
  syncNow: () => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const SYNC_TK: Record<string, string> = {
  connecting: 'sync_connecting',
  syncing: 'sync_syncing',
  synced: 'sync_synced',
  error: 'sync_error',
}

export function SyncPanel({ sync }: { sync: SyncProp }) {
  const t = useT()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (!sync.configured) {
    return (
      <section className="setting-block">
        <p className="section-head">{t('sync')}</p>
        <div className="row" style={{ borderBottom: 'none', padding: '4px 0' }}>
          <div className="r-text">
            <div className="r-title" style={{ fontSize: 15 }}>{t('sync_off')}</div>
            <div className="r-sub">{t('sync_desc_off')}</div>
          </div>
        </div>
      </section>
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!email.trim() || !password) return
    setBusy(true)
    try {
      if (mode === 'login') await sync.login(email.trim(), password)
      else await sync.signup(email.trim(), password)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sync_error'))
    } finally {
      setBusy(false)
    }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      setError(t('sync_email_required'))
      return
    }
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await sync.resetPassword(email.trim())
      setNotice(t('sync_reset_sent'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sync_error'))
    } finally {
      setBusy(false)
    }
  }

  if (sync.status === 'loggedOut') {
    return (
      <section className="setting-block">
        <p className="section-head">{t('sync')}</p>
        <p className="r-sub" style={{ marginBottom: 12 }}>{t('sync_intro')}</p>
        <form onSubmit={submit}>
          <div className="field">
            <label className="flabel" htmlFor="sync-email">{t('sync_email')}</label>
            <input
              id="sync-email"
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="flabel" htmlFor="sync-password">{t('sync_password')}</label>
            <input
              id="sync-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error">{error}</p>}
          {notice && <p className="muted">{notice}</p>}

          <div className="two" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError('')
                setNotice('')
              }}
            >
              {mode === 'login' ? t('sync_switch_signup') : t('sync_switch_login')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? t('sync_connecting') : mode === 'login' ? t('sync_login') : t('sync_signup')}
            </button>
          </div>

          {mode === 'login' && (
            <button
              type="button"
              className="link"
              style={{ marginTop: 10 }}
              onClick={forgotPassword}
              disabled={busy}
            >
              {t('sync_forgot')}
            </button>
          )}
        </form>
      </section>
    )
  }

  return (
    <section className="setting-block">
      <p className="section-head">{t('sync')}</p>
      <div className="row" style={{ borderBottom: 'none', padding: '4px 0' }}>
        <div className="r-text">
          <div className="r-title" style={{ fontSize: 15 }}>{t(SYNC_TK[sync.status] ?? 'sync_synced')}</div>
          <div className="r-sub">{sync.status === 'error' ? sync.lastError : sync.email ?? ''}</div>
        </div>
        <button className="link" onClick={sync.syncNow}>{t('sync_now')}</button>
      </div>
      <button className="link danger" style={{ marginTop: 8 }} onClick={sync.logout}>
        {t('sync_logout')}
      </button>
    </section>
  )
}
