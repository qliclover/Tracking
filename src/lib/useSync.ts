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

export type SyncStatus = 'loggedOut' | 'connecting' | 'synced' | 'syncing' | 'error'

interface Options {
  state: AppState
  /** Called when the cloud has a newer state that should replace local. */
  onRemote: (remote: AppState) => void
}

/** Drives account-based cloud sync (Cognito + DynamoDB via our own /api routes). */
export function useSync({ state, onRemote }: Options) {
  const [status, setStatus] = useState<SyncStatus>('connecting')
  const [lastError, setLastError] = useState('')
  const [username, setUsername] = useState<string | null>(null)
  const bootstrapped = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPushed = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const reconcile = useCallback(async () => {
    try {
      setStatus('connecting')
      const remote = await pull()
      if (remote && remote.updatedAt > stateRef.current.updatedAt) {
        onRemote(remote)
        lastPushed.current = remote.updatedAt
      } else {
        await push(stateRef.current)
        lastPushed.current = stateRef.current.updatedAt
      }
      setStatus('synced')
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Sync failed.')
      setStatus('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRemote])

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
    if (status === 'loggedOut' || !bootstrapped.current) return
    if (state.updatedAt <= lastPushed.current) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        setStatus('syncing')
        await push(state)
        lastPushed.current = state.updatedAt
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
    lastPushed.current = 0
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

  return { status, lastError, username, syncNow, login, signup, confirm, resend, logout, forgot, resetPass }
}
