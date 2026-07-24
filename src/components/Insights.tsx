import { Expense } from '../lib/types'
import { Period } from '../lib/period'
import { money } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { QUICK_CATEGORIES } from '../lib/categories'
import { categoryTotals, dailyTotals } from '../lib/stats'
import { useT, useLang, categoryLabel } from '../lib/i18n'

interface Props {
  expenses: Expense[]
  period: Period
  currency: string
  daysElapsed: number
}

export function Insights({ expenses, period, currency, daysElapsed }: Props) {
  const t = useT()
  const lang = useLang()

  if (expenses.length === 0) {
    return (
      <section className="empty">
        <span className="serif cjk">{t('stat_empty')}</span>
      </section>
    )
  }

  const cats = categoryTotals(expenses)
  const total = cats.reduce((s, c) => s + c.total, 0)
  const perDay = daysElapsed > 0 ? total / daysElapsed : total
  const days = dailyTotals(expenses, period)
  const maxDay = Math.max(...days.map((d) => d.total), 1)

  return (
    <section>
      <div className="stat-headline">
        <span className="serif stat-total">{money(total, currency)}</span>
        <span className="muted">
          {t('stat_perday', { v: money(perDay, currency) })}
        </span>
      </div>

      <p className="section-head" style={{ marginTop: 20 }}>{t('stat_by_category')}</p>
      <ul className="cat-stats">
        {cats.map((c) => (
          <li key={c.category}>
            <div className="cat-stat-top">
              <span className="cat-stat-name">
                <span className="dot" style={{ background: categoryColor(c.category, QUICK_CATEGORIES) }} />
                {categoryLabel(c.category, lang)}
              </span>
              <span className="cat-stat-amt">
                {money(c.total, currency)} <span className="muted">{Math.round(c.pct * 100)}%</span>
              </span>
            </div>
            <div className="cat-bar">
              <div
                className="cat-bar-fill"
                style={{ width: `${Math.max(2, c.pct * 100)}%`, background: categoryColor(c.category, QUICK_CATEGORIES) }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="section-head" style={{ marginTop: 24 }}>{t('stat_daily')}</p>
      <div className="day-chart" aria-hidden="true">
        {days.map((d) => (
          <div key={d.iso} className="day-col" title={`${d.day}: ${money(d.total, currency)}`}>
            <div className="day-bar" style={{ height: `${(d.total / maxDay) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="day-axis">
        <span>{days[0]?.day}</span>
        <span>{days[days.length - 1]?.day}</span>
      </div>
    </section>
  )
}
