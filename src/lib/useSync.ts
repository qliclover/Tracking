import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from './types'
import {
  currentEmail,
  isCloudConfigured,
  isLoggedIn,
  logIn,
  logOut,
  pull,
  push,
  requestPasswordReset,
  signUp,
} from './sync'

export type SyncStatus = 'off' | 'loggedOut' | 'connecting' | 'synced' | 'syncing' | 'error'

interface Options {
  state: AppState
  /** Called when the cloud has a newer state that should replace local. */
  onRemote: (remote: AppState) => void
}

/**
 * Drives optional cloud sync. No-op when cloud isn't configured, and idle
 * until the user logs in (a real account, so it can follow them to a new
 * device rather than being pinned to this one).
 */
export function useSync({ state, onRemote }: Options) {
  const configured = isCloudConfigured()
  const [status, setStatus] = useState<SyncStatus>(configured ? 'connecting' : 'off')
  const [lastError, setLastError] = useState('')
  const [email, setEmail] = useState<string | null>(null)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setLastError(e instanceof Error ? e.message : 'Sync failed.')
      setStatus('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRemote])

  // Initial: pick up an existing session (if any) and reconcile.
  useEffect(() => {
    if (!configured || bootstrapped.current) return
    bootstrapped.current = true
    ;(async () => {
      const loggedIn = await isLoggedIn()
      if (!loggedIn) {
        setStatus('loggedOut')
        return
      }
      setEmail(await currentEmail())
      await reconcile()
    })()
  }, [configured, reconcile])

  // Debounced push on local change.
  useEffect(() => {
    if (!configured || status === 'loggedOut' || !bootstrapped.current) return
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
  }, [state, configured, status])

  async function syncNow() {
    if (!configured || status === 'loggedOut') return
    await reconcile()
  }

  async function login(emailAddr: string, password: string) {
    setLastError('')
    await logIn(emailAddr, password)
    setEmail(emailAddr)
    await reconcile()
  }

  async function signup(emailAddr: string, password: string) {
    setLastError('')
    await signUp(emailAddr, password)
    setEmail(emailAddr)
    lastPushed.current = 0
    await reconcile()
  }

  async function logout() {
    await logOut()
    setEmail(null)
    setStatus('loggedOut')
  }

  async function resetPassword(emailAddr: string) {
    await requestPasswordReset(emailAddr)
  }

  return { status, lastError, email, syncNow, configured, login, signup, logout, resetPassword }
}
