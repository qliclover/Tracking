import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from './types'
import {
  confirmSignUp,
  currentUsername,
  forgotPassword,
  isLoggedIn,
  logIn,
  logOut,
  pull,
  push,
  resendCode,
  resetPassword,
  signUp,
} from './sync'

export type SyncStatus = 'loggedOut' | 'connecting' | 'synced' | 'syncing' | 'error' | 'conflict'

interface Options {
  state: AppState
  /** Called when the cloud has a newer state that should replace local. */
  onRemote: (remote: AppState) => void
}

// Persisted so the sync baseline survives a page reload — without this, every
// reload would forget what was last confirmed synced and misread ordinary
// local edits since then as a conflict against the cloud.
const BASELINE_KEY = 'margin.cloud.lastSyncedAt'

function loadBaseline(): number {
  const n = Number(localStorage.getItem(BASELINE_KEY))
  return Number.isFinite(n) ? n : 0
}

/** Drives account-based cloud sync (Cognito + DynamoDB via our own /api routes). */
export function useSync({ state, onRemote }: Options) {
  const [status, setStatus] = useState<SyncStatus>('connecting')
  const [lastError, setLastError] = useState('')
  const [username, setUsername] = useState<string | null>(null)
  const [conflict, setConflict] = useState<{ local: AppState; remote: AppState } | null>(null)
  const bootstrapped = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The updatedAt we last confirmed is on the server AND reflected locally —
  // i.e. the common ancestor point for detecting a genuine conflict below.
  const lastPushed = useRef(loadBaseline())
  const stateRef = useRef(state)
  stateRef.current = state

  function setBaseline(n: number) {
    lastPushed.current = n
    localStorage.setItem(BASELINE_KEY, String(n))
  }

  const reconcile = useCallback(async () => {
    try {
      setStatus('connecting')
      const remote = await pull()
      const localChanged = stateRef.current.updatedAt > lastPushed.current
      const remoteChanged = Boolean(remote && remote.updatedAt > lastPushed.current)
      if (remote && localChanged && remoteChanged) {
        // Both sides changed since the last known-good sync point — picking
        // whichever has the larger timestamp would silently discard the
        // other side's edits, so surface it instead of guessing.
        setConflict({ local: stateRef.current, remote })
        setStatus('conflict')
        return
      }
      if (remote && remoteChanged) {
        onRemote(remote)
        setBaseline(remote.updatedAt)
      } else {
        await push(stateRef.current)
        setBaseline(stateRef.current.updatedAt)
      }
      setStatus('synced')
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Sync failed.')
      setStatus('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRemote])

  /** Conflict resolution: keep this device's version, overwriting the cloud. */
  async function keepLocal() {
    if (!conflict) return
    try {
      await push(conflict.local)
      setBaseline(conflict.local.updatedAt)
      setConflict(null)
      setStatus('synced')
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Sync failed.')
      setStatus('error')
    }
  }

  /** Conflict resolution: keep the cloud's version, overwriting this device. */
  function keepRemote() {
    if (!conflict) return
    onRemote(conflict.remote)
    setBaseline(conflict.remote.updatedAt)
    setConflict(null)
    setStatus('synced')
  }

  // Pick up an existing session (if any) and reconcile.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    if (!isLoggedIn()) {
      setStatus('loggedOut')
      return
    }
    setUsername(currentUsername())
    reconcile()
  }, [reconcile])

  // Debounced push on local change.
  useEffect(() => {
    if (status === 'loggedOut' || status === 'conflict' || !bootstrapped.current) return
    if (state.updatedAt <= lastPushed.current) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        setStatus('syncing')
        await push(state)
        setBaseline(state.updatedAt)
        setStatus('synced')
      } catch (e) {
        setLastError(e instanceof Error ? e.message : 'Sync failed.')
        setStatus('error')
      }
    }, 1500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [state, status])

  async function syncNow() {
    if (status === 'loggedOut') return
    await reconcile()
  }

  async function login(u: string, password: string) {
    setLastError('')
    await logIn(u, password)
    setUsername(u)
    await reconcile()
  }

  async function signup(u: string, email: string, password: string) {
    setLastError('')
    await signUp(u, email, password)
  }

  /** Confirm the code emailed on signup, then log straight in. */
  async function confirm(u: string, code: string, password: string) {
    setLastError('')
    await confirmSignUp(u, code)
    await login(u, password)
  }

  async function resend(u: string) {
    await resendCode(u)
  }

  async function logout() {
    await logOut()
    setUsername(null)
    setConflict(null)
    setBaseline(0)
    setStatus('loggedOut')
  }

  async function forgot(u: string) {
    setLastError('')
    await forgotPassword(u)
  }

  /** Confirm the code emailed for password reset, set the new password, then log straight in. */
  async function resetPass(u: string, code: string, newPassword: string) {
    setLastError('')
    await resetPassword(u, code, newPassword)
    await login(u, newPassword)
  }

  return {
    status,
    lastError,
    username,
    conflict,
    keepLocal,
    keepRemote,
    syncNow,
    login,
    signup,
    confirm,
    resend,
    logout,
    forgot,
    resetPass,
  }
}
