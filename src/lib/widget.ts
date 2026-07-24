import { Capacitor, registerPlugin } from '@capacitor/core'
import { BudgetSummary } from './budget'
import { Category, Expense } from './types'
import { money } from './format'
import { translate, Lang } from './i18n'
import { categoryColor } from './categoryColors'
import { categoryDisplay } from './categories'

interface WidgetExpense {
  title: string
  amountText: string
  color: string
}

interface WidgetBridgePlugin {
  setSummary(options: {
    monthLabel: string
    monthName: string
    remainingText: string
    negative: boolean
    budgetText: string
    spentText: string
    perDayText: string
    pct: number
    daysLeft: number
    level: string
    reminder: string
    recent: WidgetExpense[]
  }): Promise<void>
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge')

function reminderText(summary: BudgetSummary, currency: string, lang: Lang): string {
  const m = (n: number) => money(n, currency)
  if (summary.budget <= 0) return translate('set_budget_first', lang)
  if (summary.level === 'over') return translate('rem_over', lang, { v: m(summary.remaining) })
  if (summary.level === 'warn')
    return translate('rem_warn', lang, { v: m(summary.remaining), p: m(summary.perDay) })
  return translate('rem_ok', lang, { p: m(summary.perDay) })
}

/** Push the current budget summary into the shared App Group so the iOS home/lock-screen widgets can show it. No-op on web. */
export function syncWidget(
  summary: BudgetSummary,
  currency: string,
  monthLabel: string,
  monthName: string,
  lang: Lang,
  recentExpenses: Expense[],
  categories: Category[],
): void {
  if (!Capacitor.isNativePlatform()) return

  const recent: WidgetExpense[] = recentExpenses.slice(0, 3).map((e) => ({
    title: e.note || categoryDisplay(e.category, lang),
    amountText: money(e.amount, currency),
    color: categoryColor(e.category, categories),
  }))

  WidgetBridge.setSummary({
    monthLabel,
    monthName,
    remainingText: money(summary.remaining, currency),
    negative: summary.remaining < 0,
    budgetText: money(summary.budget, currency),
    spentText: money(summary.spent, currency),
    perDayText: money(summary.perDay, currency),
    pct: Math.min(100, Math.round(summary.ratio * 100)),
    daysLeft: summary.daysLeft,
    level: summary.level,
    reminder: reminderText(summary, currency, lang),
    recent,
  }).catch((err) => {
    console.error('[widget] setSummary failed', err)
  })
}
