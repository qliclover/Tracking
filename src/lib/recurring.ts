import { AppState, Expense, Recurring } from './types'
import { Period, occurrenceInPeriod, isoOf } from './period'
import { makeExpense } from './storage'

function occKey(rec: Recurring, chargeISO: string): string {
  return `${rec.id}:${chargeISO}`
}

/**
 * Charges that are due (on/before today) in this cycle but haven't been posted
 * yet. Returns the new expenses to append and the occurrence keys to record.
 */
export function pendingCharges(
  state: AppState,
  period: Period,
  now: Date = new Date(),
): { expenses: Expense[]; keys: string[] } {
  const todayISO = isoOf(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
  const posted = new Set(state.postedRecurring)
  const expenses: Expense[] = []
  const keys: string[] = []

  for (const rec of state.recurring) {
    if (!rec.active || rec.amount <= 0) continue
    const occ = occurrenceInPeriod(rec.dayOfMonth, period)
    if (!occ) continue
    const chargeISO = isoOf(occ)
    if (chargeISO > todayISO) continue // upcoming — reserved, not posted yet
    const key = occKey(rec, chargeISO)
    if (posted.has(key)) continue
    expenses.push(
      makeExpense({
        amount: rec.amount,
        category: rec.category,
        note: rec.name,
        date: chargeISO,
        source: 'recurring',
        recurringId: rec.id,
      }),
    )
    keys.push(key)
  }
  return { expenses, keys }
}

/**
 * Sum of active recurring charges scheduled later in this cycle (after today) —
 * money you should set aside now so "left to spend" stays honest.
 */
export function reservedForPeriod(
  state: AppState,
  period: Period,
  now: Date = new Date(),
): number {
  const todayISO = isoOf(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
  let sum = 0
  for (const rec of state.recurring) {
    if (!rec.active || rec.amount <= 0) continue
    const occ = occurrenceInPeriod(rec.dayOfMonth, period)
    if (!occ) continue
    if (isoOf(occ) > todayISO) sum += rec.amount
  }
  return sum
}
