import { Category, Expense } from './types'
import { Period } from './period'

export interface CategoryStat {
  category: string
  total: number
  pct: number // 0-1 of total spend
}

/** Totals per category for the given expenses, sorted high → low. */
export function categoryTotals(expenses: Expense[], categories: readonly Category[]): CategoryStat[] {
  const map = new Map<string, number>()
  let grand = 0
  for (const e of expenses) {
    const a = Number.isFinite(e.amount) ? e.amount : 0
    map.set(e.category, (map.get(e.category) ?? 0) + a)
    grand += a
  }
  const order = (c: string) => {
    const i = categories.findIndex((cat) => cat.name === c)
    return i < 0 ? 999 : i
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total, pct: grand > 0 ? total / grand : 0 }))
    .sort((a, b) => b.total - a.total || order(a.category) - order(b.category))
}

export interface DayStat {
  iso: string
  day: number // day-of-month
  total: number
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** Spend per day across the cycle, from start up to today (or cycle end). */
export function dailyTotals(expenses: Expense[], period: Period, now: Date = new Date()): DayStat[] {
  const byDay = new Map<string, number>()
  for (const e of expenses) byDay.set(e.date, (byDay.get(e.date) ?? 0) + (Number.isFinite(e.amount) ? e.amount : 0))

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const stop = today.getTime() + 86400000 < period.end.getTime() ? new Date(today.getTime() + 86400000) : period.end

  const out: DayStat[] = []
  for (let d = new Date(period.start); d < stop; d = new Date(d.getTime() + 86400000)) {
    const iso = isoOf(d)
    out.push({ iso, day: d.getDate(), total: byDay.get(iso) ?? 0 })
  }
  return out
}
