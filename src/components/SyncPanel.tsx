import { FormEvent, useState } from 'react'
import { AppState } from '../lib/types'
import { useT } from '../lib/i18n'
import { SyncStatus } from '../lib/useSync'

export interface SyncProp {
  status: SyncStatus
  username: string | null
  lastError: string
  conflict: { local: AppState; remote: AppState } | null
  keepLocal: () => void
  keepRemote: () => void
  syncNow: () => void
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  confirm: (username: string, code: string, password: string) => Promise<void>
  resend: (username: string) => Promise<void>
  logout: () => Promise<void>
  forgot: (username: string) => Promise<void>
  resetPass: (username: string, code: string, newPassword: string) => Promise<void>
}

const SYNC_TK: Record<string, string> = {
  connecting: 'sync_connecting',
  syncing: 'sync_syncing',
  synced: 'sync_synced',
  error: 'sync_error',
  conflict: 'sync_conflict',
}

type Mode = 'login' | 'signup' | 'confirm' | 'forgot-request' | 'forgot-reset'

export function SyncPanel({ sync }: { sync: SyncProp }) {
  const t = useT()
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function reset() {
    setError('')
    setNotice('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    reset()
    setBusy(true)
    try {
      if (mode === 'login') {
        if (!username.trim() || !password) return
        await sync.login(username.trim(), password)
      } else if (mode === 'signup') {
        if (!username.trim() || !password) return
        if (!email.trim()) {
          setError(t('sync_email_required'))
          return
        }
        await sync.signup(username.trim(), email.trim(), password)
        setMode('confirm')
      } else if (mode === 'confirm') {
        await sync.confirm(username.trim(), code.trim(), password)
      } else if (mode === 'forgot-request') {
        if (!username.trim()) return
        await sync.forgot(username.trim())
        setNotice(t('sync_code_sent'))
        setMode('forgot-reset')
      } else {
        await sync.resetPass(username.trim(), code.trim(), newPassword)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sync_error'))
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    reset()
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
          {(mode === 'login' || mode === 'signup' || mode === 'forgot-request' || mode === 'forgot-reset') && (
            <div className="field">
              <label className="flabel" htmlFor="sync-username">{t('sync_username')}</label>
              <input
                id="sync-username"
                autoCapitalize="none"
                autoCorrect="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                readOnly={mode === 'forgot-reset'}
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

          {(mode === 'login' || mode === 'signup') && (
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

          {mode === 'forgot-reset' && (
            <>
              <p className="r-sub" style={{ marginBottom: 12 }}>{t('sync_reset_hint')}</p>
              <div className="field">
                <label className="flabel" htmlFor="sync-reset-code">{t('sync_code')}</label>
                <input
                  id="sync-reset-code"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="flabel" htmlFor="sync-new-password">{t('sync_new_password')}</label>
                <input
                  id="sync-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {error && <p className="error">{error}</p>}
          {notice && <p className="muted">{notice}</p>}

          <div className="two" style={{ marginTop: 12 }}>
            {mode === 'login' && (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => {
                  setMode('signup')
                  reset()
                }}
              >
                {t('sync_switch_signup')}
              </button>
            )}
            {mode === 'signup' && (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => {
                  setMode('login')
                  reset()
                }}
              >
                {t('sync_switch_login')}
              </button>
            )}
            {mode === 'confirm' && (
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={resend}>
                {t('sync_resend')}
              </button>
            )}
            {(mode === 'forgot-request' || mode === 'forgot-reset') && (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => {
                  setMode('login')
                  reset()
                }}
              >
                {t('sync_switch_login')}
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy
                ? t('sync_connecting')
                : mode === 'login'
                  ? t('sync_login')
                  : mode === 'signup'
                    ? t('sync_signup')
                    : mode === 'confirm'
                      ? t('sync_confirm')
                      : mode === 'forgot-request'
                        ? t('sync_send_code')
                        : t('sync_reset_submit')}
            </button>
          </div>

          {mode === 'login' && (
            <button
              type="button"
              className="link"
              style={{ marginTop: 10 }}
              onClick={() => {
                setMode('forgot-request')
                reset()
              }}
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
          <div className="r-sub">{sync.status === 'error' ? sync.lastError : sync.username ?? ''}</div>
        </div>
        <button className="link" onClick={sync.syncNow}>{t('sync_now')}</button>
      </div>

      {sync.status === 'conflict' && sync.conflict && (
        <div style={{ margin: '8px 0', padding: '12px', border: '1px solid var(--border-2)', borderRadius: 10 }}>
          <p className="r-sub" style={{ marginBottom: 10 }}>{t('sync_conflict_desc')}</p>
          <div className="two">
            <button type="button" className="btn btn-ghost" onClick={sync.keepLocal}>
              {t('sync_keep_local')}
            </button>
            <button type="button" className="btn btn-primary" onClick={sync.keepRemote}>
              {t('sync_keep_remote')}
            </button>
          </div>
        </div>
      )}

      <button className="link danger" style={{ marginTop: 8 }} onClick={sync.logout}>
        {t('sync_logout')}
      </button>
    </section>
  )
}
