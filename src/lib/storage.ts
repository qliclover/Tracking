import { AppState, DEFAULT_SETTINGS, Expense } from './types'

const STORAGE_KEY = 'margin.appState.v1'

export function emptyState(): AppState {
  return { settings: DEFAULT_SETTINGS, expenses: [], profile: {}, updatedAt: 0 }
}

/** Read the persisted state, tolerating missing/corrupt data. */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      profile: parsed.profile ?? {},
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable (e.g. private mode) — fail silently.
  }
}

/** Small helper to mint reasonably-unique ids without a dependency. */
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c && 'randomUUID' in c) return c.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function makeExpense(input: Omit<Expense, 'id' | 'createdAt'>): Expense {
  return { ...input, id: newId(), createdAt: Date.now() }
}
