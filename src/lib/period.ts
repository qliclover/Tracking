import { Expense } from './types'

/** A budget cycle: [start, end) where end is the next reset instant. */
export interface Period {
  start: Date
  end: Date
  /** Stable key based on the start date, e.g. "2026-07-15". */
  key: string
  /** Header label, e.g. "JULY 2026" or "JUL 15 – AUG 14". */
  label: string
}

function midnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Clamp a desired day-of-month to a real day in month m (0-based) of year y. */
export function clampDay(y: number, m: number, day: number): number {
  const last = new Date(y, m + 1, 0).getDate()
  return Math.min(Math.max(1, day), last)
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const MONTH = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]
const ZH_MONTH = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
]

/** The budget cycle that contains `now`, given a reset day-of-month. */
export function currentPeriod(resetDay: number, now: Date = new Date()): Period {
  const today = midnight(now)
  const y = today.getFullYear()
  const m = today.getMonth()

  let start = new Date(y, m, clampDay(y, m, resetDay))
  if (today < start) {
    // The reset for this month hasn't happened yet — cycle started last month.
    start = new Date(y, m - 1, clampDay(y, m - 1, resetDay))
  }
  const end = new Date(start.getFullYear(), start.getMonth() + 1, clampDay(
    start.getFullYear(),
    start.getMonth() + 1,
    resetDay,
  ))

  const lastDay = new Date(end.getTime() - 86400000)
  const label =
    resetDay === 1
      ? `${MONTH[start.getMonth()]} ${start.getFullYear()}`
      : `${MON[start.getMonth()]} ${start.getDate()} – ${MON[lastDay.getMonth()]} ${lastDay.getDate()}`

  return { start, end, key: iso(start), label }
}

/** Localized cycle label for the header. */
export function periodLabel(p: Period, resetDay: number, lang: 'zh' | 'en'): string {
  const s = p.start
  const last = new Date(p.end.getTime() - 86400000)
  if (lang === 'zh') {
    if (resetDay === 1) return `${s.getFullYear()}年 ${ZH_MONTH[s.getMonth()]}`
    return `${s.getMonth() + 1}月${s.getDate()}日 – ${last.getMonth() + 1}月${last.getDate()}日`
  }
  return p.label
}

/** Just the month word, no year — e.g. "三月" or "Mar" — for compact widget headers. */
export function periodMonthName(p: Period, lang: 'zh' | 'en'): string {
  return lang === 'zh' ? ZH_MONTH[p.start.getMonth()] : MON[p.start.getMonth()]
}

export function isInPeriod(isoDate: string, p: Period): boolean {
  return isoDate >= iso(p.start) && isoDate < iso(p.end)
}

export function expensesForPeriod(expenses: Expense[], p: Period): Expense[] {
  return expenses
    .filter((e) => isInPeriod(e.date, p))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
}

/** Days remaining in the cycle, counting today. */
export function daysLeftInPeriod(p: Period, now: Date = new Date()): number {
  const ms = p.end.getTime() - midnight(now).getTime()
  return Math.max(1, Math.round(ms / 86400000))
}

/**
 * The single charge date for a given day-of-month within this cycle, or null.
 * A cycle spans parts of two calendar months, so the day lands in exactly one.
 */
export function occurrenceInPeriod(dayOfMonth: number, p: Period): Date | null {
  const candidates = [
    new Date(p.start.getFullYear(), p.start.getMonth(), clampDay(p.start.getFullYear(), p.start.getMonth(), dayOfMonth)),
    new Date(p.end.getFullYear(), p.end.getMonth(), clampDay(p.end.getFullYear(), p.end.getMonth(), dayOfMonth)),
  ]
  for (const c of candidates) {
    if (c >= p.start && c < p.end) return c
  }
  return null
}

export function isoOf(d: Date): string {
  return iso(d)
}

/** Group key for an expense's calendar month, e.g. "2025-03". */
export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/** Localized label for a "YYYY-MM" month key, e.g. "2025年 三月" / "March 2025". */
export function monthKeyLabel(key: string, lang: 'zh' | 'en'): string {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  return lang === 'zh' ? `${y}年 ${ZH_MONTH[m - 1]}` : `${MONTH[m - 1]} ${y}`
}
