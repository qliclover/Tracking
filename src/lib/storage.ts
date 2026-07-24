import { AppState, DEFAULT_SETTINGS, Expense } from './types'
import { defaultCategories } from './categories'

const STORAGE_KEY = 'margin.appState.v1'

// Old English category keys, kept only to migrate pre-custom-category data.
const LEGACY_KEYS = ['Food', 'Transport', 'Shopping', 'Bills', 'Fun', 'Other'] as const

export function emptyState(): AppState {
  return {
    settings: DEFAULT_SETTINGS,
    expenses: [],
    profile: {},
    categories: defaultCategories(DEFAULT_SETTINGS.lang),
    recurring: [],
    postedRecurring: [],
    updatedAt: 0,
  }
}

/** Read the persisted state, tolerating missing/corrupt data. */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) }
    let expenses = Array.isArray(parsed.expenses) ? parsed.expenses : []
    let recurring = Array.isArray(parsed.recurring) ? parsed.recurring : []
    let categories = Array.isArray(parsed.categories) && parsed.categories.length > 0
      ? parsed.categories
      : null

    if (!categories) {
      // First run after the custom-categories migration: seed from the old
      // fixed list and rewrite any expenses/bills still using the English keys.
      const seeded = defaultCategories(settings.lang)
      const rename = new Map<string, string>(LEGACY_KEYS.map((key, i) => [key, seeded[i].name]))
      expenses = expenses.map((e) => (rename.has(e.category) ? { ...e, category: rename.get(e.category)! } : e))
      recurring = recurring.map((r) =>
        rename.has(r.category) ? { ...r, category: rename.get(r.category)! } : r,
      )
      categories = seeded
    }

    return {
      settings,
      expenses,
      profile: parsed.profile ?? {},
      categories,
      recurring,
      postedRecurring: Array.isArray(parsed.postedRecurring) ? parsed.postedRecurring : [],
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
