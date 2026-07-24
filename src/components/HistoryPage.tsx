import { useMemo, useState } from 'react'
import { Category, Expense } from '../lib/types'
import { signedMoney, prettyDate, money } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { categoryDisplay } from '../lib/categories'
import { monthKey, monthOnlyLabel, yearOfKey } from '../lib/period'
import { useT, useLang } from '../lib/i18n'

interface Props {
  expenses: Expense[]
  categories: Category[]
  currency: string
  onDelete: (id: string) => void
}

interface MonthGroup {
  key: string
  list: Expense[]
  total: number
}

/** All expenses grouped by year → month — browse one month at a time, not everything at once. */
export function HistoryList({ expenses, categories, currency, onDelete }: Props) {
  const t = useT()
  const lang = useLang()
  const [selected, setSelected] = useState<string | null>(null)

  const groups = useMemo<MonthGroup[]>(() => {
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

  const activeGroup = selected ? groups.find((g) => g.key === selected) : undefined

  if (activeGroup) {
    return (
      <section>
        <button type="button" className="link" onClick={() => setSelected(null)}>
          ‹ {t('history')}
        </button>
        <div className="row" style={{ borderBottom: 'none', padding: '12px 0 8px' }}>
          <p className="section-head" style={{ margin: 0 }}>{yearOfKey(activeGroup.key)} · {monthOnlyLabel(activeGroup.key, lang)}</p>
          <span className="muted">{money(activeGroup.total, currency)}</span>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {activeGroup.list.map((e) => (
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
      </section>
    )
  }

  const byYear: { year: string; months: MonthGroup[] }[] = []
  for (const g of groups) {
    const year = yearOfKey(g.key)
    const last = byYear[byYear.length - 1]
    if (last && last.year === year) last.months.push(g)
    else byYear.push({ year, months: [g] })
  }

  return (
    <section>
      {byYear.map((y) => (
        <div key={y.year} style={{ marginBottom: 20 }}>
          <p className="section-head">{y.year}</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {y.months.map((g) => (
              <li key={g.key}>
                <button
                  type="button"
                  className="row"
                  style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => setSelected(g.key)}
                >
                  <div className="r-text">
                    <div className="r-title" style={{ fontSize: 15 }}>{monthOnlyLabel(g.key, lang)}</div>
                  </div>
                  <span className="r-amt">{money(g.total, currency)}</span>
                  <span className="muted" style={{ fontSize: 18, marginLeft: 8 }}>›</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
