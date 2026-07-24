import { FormEvent, useState } from 'react'
import { useT } from '../lib/i18n'
import { SyncStatus } from '../lib/useSync'

export interface SyncProp {
  status: SyncStatus
  username: string | null
  lastError: string
  syncNow: () => void
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  confirm: (username: string, code: string, password: string) => Promise<void>
  resend: (username: string) => Promise<void>
  logout: () => Promise<void>
}

const SYNC_TK: Record<string, string> = {
  connecting: 'sync_connecting',
  syncing: 'sync_syncing',
  synced: 'sync_synced',
  error: 'sync_error',
}

export function SyncPanel({ sync }: { sync: SyncProp }) {
  const t = useT()
  const [mode, setMode] = useState<'login' | 'signup' | 'confirm'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!username.trim() || !password) return
    setBusy(true)
    try {
      if (mode === 'login') {
        await sync.login(username.trim(), password)
      } else if (mode === 'signup') {
        if (!email.trim()) {
          setError(t('sync_email_required'))
          setBusy(false)
          return
        }
        await sync.signup(username.trim(), email.trim(), password)
        setMode('confirm')
      } else {
        await sync.confirm(username.trim(), code.trim(), password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sync_error'))
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await sync.resend(username.trim())
      setNotice(t('sync_code_sent'))
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
          {mode !== 'confirm' && (
            <div className="field">
              <label className="flabel" htmlFor="sync-username">{t('sync_username')}</label>
              <input
                id="sync-username"
                autoCapitalize="none"
                autoCorrect="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          {mode === 'signup' && (
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
              <p className="muted" style={{ marginTop: 4 }}>{t('sync_email_hint')}</p>
            </div>
          )}

          {mode !== 'confirm' && (
            <div className="field">
              <label className="flabel" htmlFor="sync-password">{t('sync_password')}</label>
              <input
                id="sync-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {mode === 'confirm' && (
            <>
              <p className="r-sub" style={{ marginBottom: 12 }}>{t('sync_confirm_hint')}</p>
              <div className="field">
                <label className="flabel" htmlFor="sync-code">{t('sync_code')}</label>
                <input
                  id="sync-code"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </>
          )}

          {error && <p className="error">{error}</p>}
          {notice && <p className="muted">{notice}</p>}

          <div className="two" style={{ marginTop: 12 }}>
            {mode !== 'confirm' ? (
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
            ) : (
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={resend}>
                {t('sync_resend')}
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy
                ? t('sync_connecting')
                : mode === 'login'
                  ? t('sync_login')
                  : mode === 'signup'
                    ? t('sync_signup')
                    : t('sync_confirm')}
            </button>
          </div>
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
          <div className="r-sub">{sync.status === 'error' ? sync.lastError : sync.username ?? ''}</div>
        </div>
        <button className="link" onClick={sync.syncNow}>{t('sync_now')}</button>
      </div>
      <button className="link danger" style={{ marginTop: 8 }} onClick={sync.logout}>
        {t('sync_logout')}
      </button>
    </section>
  )
}
