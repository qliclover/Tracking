import { useEffect, useRef, useState } from 'react'
import { AppState } from './types'
import { isCloudConfigured, pull, push } from './sync'

export type SyncStatus = 'off' | 'connecting' | 'synced' | 'syncing' | 'error'

interface Options {
  state: AppState
  /** Called when the cloud has a newer state that should replace local. */
  onRemote: (remote: AppState) => void
}

/**
 * Drives optional cloud sync. No-op when cloud isn't configured.
 * - On first load: pull; if remote is newer, adopt it, else push local.
 * - On later local edits: debounced push.
 */
export function useSync({ state, onRemote }: Options) {
  const configured = isCloudConfigured()
  const [status, setStatus] = useState<SyncStatus>(configured ? 'connecting' : 'off')
  const [lastError, setLastError] = useState('')
  const bootstrapped = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPushed = useRef(0)

  // Initial reconcile.
  useEffect(() => {
    if (!configured || bootstrapped.current) return
    bootstrapped.current = true
    let cancelled = false
    ;(async () => {
      try {
        setStatus('connecting')
        const remote = await pull()
        if (cancelled) return
        if (remote && remote.updatedAt > state.updatedAt) {
          onRemote(remote)
          lastPushed.current = remote.updatedAt
        } else {
          await push(state)
          lastPushed.current = state.updatedAt
        }
        setStatus('synced')
      } catch (e) {
        if (cancelled) return
        setLastError(e instanceof Error ? e.message : 'Sync failed.')
        setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured])

  // Debounced push on local change.
  useEffect(() => {
    if (!configured || !bootstrapped.current) return
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
  }, [state, configured])

  async function syncNow() {
    if (!configured) return
    try {
      setStatus('syncing')
      const remote = await pull()
      if (remote && remote.updatedAt > state.updatedAt) onRemote(remote)
      else await push(state)
      lastPushed.current = Math.max(state.updatedAt, remote?.updatedAt ?? 0)
      setStatus('synced')
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Sync failed.')
      setStatus('error')
    }
  }

  return { status, lastError, syncNow, configured }
}
