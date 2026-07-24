import { AppState } from './types'

/**
 * Cloud sync via our own /api/auth + /api/state routes, which proxy to
 * Cognito (accounts) and DynamoDB (data). The browser never talks to AWS
 * directly or holds AWS credentials — only a Cognito access/refresh token
 * pair, so this works the same in the native app and on the web.
 */

const TOKENS_KEY = 'margin.cloud.tokens'
const USERNAME_KEY = 'margin.cloud.username'

interface Tokens {
  accessToken: string
  idToken: string
  refreshToken?: string
}

function loadTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    return null
  }
}

function saveTokens(t: Tokens): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(t))
}

function clearTokens(): void {
  localStorage.removeItem(TOKENS_KEY)
  localStorage.removeItem(USERNAME_KEY)
}

export function isLoggedIn(): boolean {
  return Boolean(loadTokens())
}

export function currentUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY)
}

async function authCall<T>(body: Record<string, unknown>): Promise<T> {
  let res: Response
  try {
    res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error("Can't reach the sync service.")
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`)
  return data
}

export async function signUp(username: string, email: string, password: string): Promise<void> {
  await authCall({ action: 'signup', username, email, password })
  localStorage.setItem(USERNAME_KEY, username)
}

export async function confirmSignUp(username: string, code: string): Promise<void> {
  await authCall({ action: 'confirm', username, code })
}

export async function resendCode(username: string): Promise<void> {
  await authCall({ action: 'resend', username })
}

export async function logIn(username: string, password: string): Promise<void> {
  const t = await authCall<Tokens>({ action: 'login', username, password })
  saveTokens(t)
  localStorage.setItem(USERNAME_KEY, username)
}

export async function logOut(): Promise<void> {
  clearTokens()
}

async function refresh(): Promise<Tokens | null> {
  const t = loadTokens()
  const username = currentUsername()
  if (!t?.refreshToken || !username) return null
  try {
    const next = await authCall<{ accessToken: string; idToken: string }>({
      action: 'refresh',
      username,
      refreshToken: t.refreshToken,
    })
    const merged = { ...t, ...next }
    saveTokens(merged)
    return merged
  } catch {
    clearTokens()
    return null
  }
}

async function stateCall(method: 'GET' | 'PUT', body?: unknown): Promise<Response> {
  let tokens = loadTokens()
  if (!tokens) throw new Error('Not logged in.')
  const call = () =>
    fetch('/api/state', {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens!.accessToken}` },
      body: body ? JSON.stringify(body) : undefined,
    })
  let res = await call()
  if (res.status === 401) {
    tokens = await refresh()
    if (!tokens) throw new Error('Session expired. Please log in again.')
    res = await call()
  }
  return res
}

/** Fetch the remote state, or null if none exists yet. */
export async function pull(): Promise<AppState | null> {
  const res = await stateCall('GET')
  if (!res.ok) throw new Error(`Pull failed (${res.status}).`)
  const data = (await res.json()) as { state: AppState | null }
  return data.state
}

/** Write the full state to the cloud. */
export async function push(state: AppState): Promise<void> {
  const res = await stateCall('PUT', { state })
  if (!res.ok) throw new Error(`Push failed (${res.status}).`)
}
