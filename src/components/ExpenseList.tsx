import { useMemo } from 'react'
import { Category, Expense } from '../lib/types'
import { signedMoney, dayGroupLabel } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { categoryDisplay } from '../lib/categories'
import { useT, useLang } from '../lib/i18n'

interface DayGroup {
  iso: string
  total: number
  list: Expense[]
}

/** Absolute "M月D日" / "Jan D" — unlike dayGroupLabel, never collapses to "Today". */
function absoluteDayLabel(iso: string, lang: 'zh' | 'en'): string {
  const [, m, day] = iso.split('-').map(Number)
  if (!m || !day) return iso
  if (lang === 'zh') return `${m}月${day}日`
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[m - 1]} ${day}`
}

function groupByDay(expenses: Expense[]): DayGroup[] {
  const byDay = new Map<string, Expense[]>()
  for (const e of expenses) {
    const list = byDay.get(e.date)
    if (list) list.push(e)
    else byDay.set(e.date, [e])
  }
  return Array.from(byDay.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([iso, list]) => ({
      iso,
      list: list.sort((a, b) => b.createdAt - a.createdAt),
      total: list.reduce((sum, e) => sum + e.amount, 0),
    }))
}

interface Props {
  expenses: Expense[]
  categories: Category[]
  currency: string
  onDelete: (id: string) => void
  /** Cap the number of day-groups shown (Home's inline preview). */
  limit?: number
  /** Show the exact date alongside the relative label (the full Ledger tab). */
  showFullDate?: boolean
  onSeeAll?: () => void
  /** Tapping a row opens its detail/edit sheet. Omit to keep rows non-interactive. */
  onOpen?: (expense: Expense) => void
}

export function ExpenseList({ expenses, categories, currency, onDelete, limit, showFullDate, onSeeAll, onOpen }: Props) {
  const t = useT()
  const lang = useLang()

  const groups = useMemo(() => groupByDay(expenses), [expenses])

  if (groups.length === 0) {
    return (
      <section className="empty">
        <span className="empty-plus">+</span>
        <span className="serif cjk empty-title">{t('clean_page')}</span>
        <p style={{ whiteSpace: 'pre-line' }}>{t('empty_cta')}</p>
      </section>
    )
  }

  const shown = limit ? groups.slice(0, limit) : groups

  return (
    <section>
      {shown.map((g) => (
        <div key={g.iso}>
          <div className="day-head">
            <span className="day-head-label">
              {dayGroupLabel(g.iso, lang)}
              {showFullDate && ` · ${absoluteDayLabel(g.iso, lang)}`}
            </span>
            <span className="day-head-total serif">{signedMoney(-g.total, currency)}</span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {g.list.map((e) => (
              <li
                key={e.id}
                className={onOpen ? 'row row-tap' : 'row'}
                role={onOpen ? 'button' : undefined}
                tabIndex={onOpen ? 0 : undefined}
                onClick={onOpen ? () => onOpen(e) : undefined}
                onKeyDown={
                  onOpen
                    ? (ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault()
                          onOpen(e)
                        }
                      }
                    : undefined
                }
              >
                <div className="r-main">
                  <span
                    className="dot"
                    style={{ background: categoryColor(e.category, categories) }}
                  />
                  <div className="r-text">
                    <div className="r-title">{e.note || categoryDisplay(e.category, lang)}</div>
                    <div className="r-sub">{categoryDisplay(e.category, lang)}</div>
                  </div>
                </div>
                <span className="r-amt">{signedMoney(-e.amount, currency)}</span>
                <button
                  className="r-del"
                  aria-label={t('remove')}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    if (confirm(t('confirm_delete_expense'))) onDelete(e.id)
                  }}
                  title={t('remove')}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {limit && groups.length >= limit && onSeeAll && (
        <button type="button" className="row see-all" onClick={onSeeAll}>
          <span className="muted">{t('all_this_month', { v: expenses.length })}</span>
          <span className="muted" style={{ fontSize: 16 }}>›</span>
        </button>
      )}
    </section>
  )
}
