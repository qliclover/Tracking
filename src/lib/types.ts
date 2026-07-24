// Core domain types for Margin.
//
// Design principle: the user has exactly ONE monthly budget, no matter how many
// bank accounts or cards they own. Every expense is just a deduction against that
// single budget. We never model accounts — that's the whole point.

export interface Expense {
  id: string
  /** Positive number, in the app's single currency. */
  amount: number
  /** Free-text label, e.g. "Groceries", "Coffee". */
  category: string
  note?: string
  /** ISO date string (YYYY-MM-DD) of when the money was spent. */
  date: string
  /** ms timestamp of creation, used for stable sorting. */
  createdAt: number
  /** How the expense was entered. Defaults to manual. */
  source?: 'manual' | 'scan' | 'voice'
  /** Merchant name when captured from a receipt or voice note. */
  merchant?: string
  /** Line items when captured from a receipt. */
  items?: { name: string; price: number }[]
}

export interface Settings {
  /** The single monthly budget cap. */
  monthlyBudget: number
  /** ISO 4217-ish symbol/label shown next to amounts. Kept simple as a string. */
  currency: string
  /**
   * When remaining budget drops to this fraction (0-1) of the total, we warn.
   * e.g. 0.2 => warn once only 20% of the budget is left.
   */
  warnThreshold: number
}

export interface Profile {
  /** Display name shown in the header / settings. */
  name?: string
  /** Avatar as a small data-URL (resized on upload). */
  avatar?: string
}

export interface AppState {
  settings: Settings
  expenses: Expense[]
  profile: Profile
  /** ms timestamp of the last change — used for last-write-wins cloud sync. */
  updatedAt: number
}

export const DEFAULT_SETTINGS: Settings = {
  monthlyBudget: 2000,
  currency: '¥',
  warnThreshold: 0.2,
}
