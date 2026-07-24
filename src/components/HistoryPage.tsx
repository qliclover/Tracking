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
  onBack: () => void
}

export function HistoryPage({ expenses, categories, currency, onDelete, onBack }: Props) {
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

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('history')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      {groups.length === 0 ? (
        <section className="empty">
          <p>{t('history_empty')}</p>
        </section>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="setting-block">
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
          </section>
        ))
      )}

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
