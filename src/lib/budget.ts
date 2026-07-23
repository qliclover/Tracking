import { Expense, Settings } from './types'

/** Returns YYYY-MM for a given Date (defaults to now). */
export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** True if an ISO date string (YYYY-MM-DD...) falls within the given YYYY-MM. */
export function isInMonth(isoDate: string, key: string): boolean {
  return isoDate.slice(0, 7) === key
}

export function expensesForMonth(expenses: Expense[], key: string): Expense[] {
  return expenses
    .filter((e) => isInMonth(e.date, key))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
}

export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0)
}

/** Days remaining in the current month, including today. */
export function daysLeftInMonth(d: Date = new Date()): number {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return last - d.getDate() + 1
}

export type BudgetLevel = 'ok' | 'warn' | 'over'

export interface BudgetSummary {
  budget: number
  spent: number
  remaining: number
  /** 0-1+ (can exceed 1 when over budget). */
  ratio: number
  level: BudgetLevel
  daysLeft: number
  /** Suggested safe spend per remaining day; 0 if nothing is left. */
  perDay: number
}

export function summarize(
  monthExpenses: Expense[],
  settings: Settings,
  now: Date = new Date(),
): BudgetSummary {
  const budget = Math.max(0, settings.monthlyBudget)
  const spent = totalSpent(monthExpenses)
  const remaining = budget - spent
  const ratio = budget > 0 ? spent / budget : spent > 0 ? 1 : 0
  const daysLeft = daysLeftInMonth(now)

  let level: BudgetLevel = 'ok'
  if (remaining < 0) level = 'over'
  else if (budget > 0 && remaining <= budget * settings.warnThreshold) level = 'warn'

  const perDay = remaining > 0 && daysLeft > 0 ? remaining / daysLeft : 0

  return { budget, spent, remaining, ratio, level, daysLeft, perDay }
}

/** Human-facing reminder line derived from the summary. */
export function reminder(s: BudgetSummary, currency: string): string {
  const money = (n: number) => `${currency}${Math.abs(n).toFixed(2)}`
  if (s.budget <= 0) return 'Set a monthly budget to start tracking.'
  if (s.level === 'over') {
    return `You're ${money(s.remaining)} over budget this month. Time to ease off.`
  }
  if (s.level === 'warn') {
    return `Careful — only ${money(s.remaining)} left, and ${s.daysLeft} day${
      s.daysLeft === 1 ? '' : 's'
    } to go (~${money(s.perDay)}/day).`
  }
  return `${money(s.remaining)} left for ${s.daysLeft} day${
    s.daysLeft === 1 ? '' : 's'
  } — about ${money(s.perDay)}/day.`
}
