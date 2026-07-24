import { Expense, Settings } from './types'

export function totalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + (Number.isFinite(e.amount) ? e.amount : 0), 0)
}

export type BudgetLevel = 'ok' | 'warn' | 'over'

export interface BudgetSummary {
  budget: number
  spent: number
  /** Upcoming fixed bills set aside for later this cycle. */
  reserved: number
  remaining: number
  /** 0-1+ share of budget already committed (spent + reserved). */
  ratio: number
  level: BudgetLevel
  daysLeft: number
  /** Suggested safe spend per remaining day; 0 if nothing is left. */
  perDay: number
}

export function summarize(
  periodExpenses: Expense[],
  settings: Settings,
  opts: { daysLeft: number; reserved: number },
): BudgetSummary {
  const budget = Math.max(0, settings.monthlyBudget)
  const spent = totalSpent(periodExpenses)
  const reserved = Math.max(0, opts.reserved)
  const remaining = budget - spent - reserved
  const committed = spent + reserved
  const ratio = budget > 0 ? committed / budget : committed > 0 ? 1 : 0
  const daysLeft = opts.daysLeft

  let level: BudgetLevel = 'ok'
  if (remaining < 0) level = 'over'
  else if (budget > 0 && remaining <= budget * settings.warnThreshold) level = 'warn'

  const perDay = remaining > 0 && daysLeft > 0 ? remaining / daysLeft : 0

  return { budget, spent, reserved, remaining, ratio, level, daysLeft, perDay }
}
