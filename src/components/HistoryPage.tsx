import { useMemo } from 'react'
import { Category, Expense } from '../lib/types'
import { signedMoney, prettyDate, money } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { categoryDisplay } from '../lib/categories'
import { monthKey, monthKeyLabel } from '../lib/period'
import { useT, useLang } from '../lib/i18n'

interface Props {
  expenses: Expense[]
  categories: Category[]
  currency: string
  onDelete: (id: string) => void
}

/** All expenses grouped by calendar month, newest first — not filtered to the current cycle. */
export function HistoryList({ expenses, categories, currency, onDelete }: Props) {
  const t = useT()
  const lang = useLang()

  const groups = useMemo(() => {
    const byMonth = new Map<string, Expense[]>()
    for (const e of expenses) {
      const key = monthKey(e.date)
      const list = byMonth.get(key)
      if (list) list.push(e)
      else byMonth.set(key, [e])
    }
    return Array.from(byMonth.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, list]) => ({
        key,
        list: list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt)),
        total: list.reduce((sum, e) => sum + e.amount, 0),
      }))
  }, [expenses])

  if (groups.length === 0) {
    return (
      <section className="empty">
        <p>{t('history_empty')}</p>
      </section>
    )
  }

  return (
    <section>
      {groups.map((g) => (
        <div key={g.key} style={{ marginBottom: 20 }}>
          <div className="row" style={{ borderBottom: 'none', padding: '4px 0 8px' }}>
            <p className="section-head" style={{ margin: 0 }}>{monthKeyLabel(g.key, lang)}</p>
            <span className="muted">{money(g.total, currency)}</span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {g.list.map((e) => (
              <li key={e.id} className="row">
                <div className="r-main">
                  <span className="dot" style={{ background: categoryColor(e.category, categories) }} />
                  <div className="r-text">
                    <div className="r-title">{e.note || categoryDisplay(e.category, lang)}</div>
                    <div className="r-sub">
                      {categoryDisplay(e.category, lang)} · {prettyDate(e.date, lang)}
                    </div>
                  </div>
                </div>
                <span className="r-amt">{signedMoney(-e.amount, currency)}</span>
                <button
                  className="r-del"
                  aria-label={t('remove')}
                  onClick={() => onDelete(e.id)}
                  title={t('remove')}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
