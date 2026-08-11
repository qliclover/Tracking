import { LocalNotifications } from '@capacitor/local-notifications'
import { Recurring } from './types'
import { BudgetLevel } from './budget'
import { translate, Lang } from './i18n'
import { money } from './format'

// Notification ids are namespaced by range so bill reminders can be
// cancelled/rescheduled as a group without touching the budget-warning id.
const BILL_ID_BASE = 1000
const BILL_ID_MAX = 9999
const BUDGET_WARN_ID = 1

const WARNED_KEY = 'margin.notif.warnedPeriod'

export async function requestNotificationPermission(): Promise<boolean> {
  const res = await LocalNotifications.requestPermissions()
  return res.display === 'granted'
}

async function cancelRange(fromId: number, toId: number) {
  const pending = await LocalNotifications.getPending()
  const ids = pending.notifications
    .filter((n) => n.id >= fromId && n.id <= toId)
    .map((n) => ({ id: n.id }))
  if (ids.length) await LocalNotifications.cancel({ notifications: ids })
}

/** Replaces whatever bill reminders were scheduled with one per active bill, repeating monthly on its charge day. */
export async function scheduleBillReminders(recurring: Recurring[], lang: Lang, currency: string) {
  await cancelRange(BILL_ID_BASE, BILL_ID_MAX)
  const active = recurring.filter((r) => r.active).slice(0, BILL_ID_MAX - BILL_ID_BASE)
  if (!active.length) return
  await LocalNotifications.schedule({
    notifications: active.map((r, i) => ({
      id: BILL_ID_BASE + i,
      title: translate('notif_bill_title', lang),
      body: translate('notif_bill_body', lang, { name: r.name, amount: money(r.amount, currency) }),
      schedule: { on: { day: r.dayOfMonth, hour: 9, minute: 0 }, repeats: true },
    })),
  })
}

export async function cancelBillReminders() {
  await cancelRange(BILL_ID_BASE, BILL_ID_MAX)
}

/** Fires once per (period, level) the first time spending crosses into warn/over — deduped via localStorage. */
export async function maybeNotifyBudgetWarning(level: BudgetLevel, periodKey: string, lang: Lang) {
  if (level === 'ok') return
  const warnedFor = `${periodKey}:${level}`
  if (localStorage.getItem(WARNED_KEY) === warnedFor) return
  localStorage.setItem(WARNED_KEY, warnedFor)
  await LocalNotifications.schedule({
    notifications: [
      {
        id: BUDGET_WARN_ID,
        title: translate('notif_budget_title', lang),
        body: translate(level === 'over' ? 'notif_budget_over_body' : 'notif_budget_warn_body', lang),
        schedule: { at: new Date(Date.now() + 1000) },
      },
    ],
  })
}
