import { Category, Expense } from '../lib/types'
import { Period } from '../lib/period'
import { BudgetSummary } from '../lib/budget'
import { money } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { categoryDisplay } from '../lib/categories'
import { categoryTotals, dailyTotals } from '../lib/stats'
import { useT, useLang } from '../lib/i18n'

interface Props {
  expenses: Expense[]
  categories: Category[]
  period: Period
  currency: string
  daysElapsed: number
  summary: BudgetSummary
}

export function Insights({ expenses, categories, period, currency, daysElapsed, summary }: Props) {
  const t = useT()
  const lang = useLang()

  if (expenses.length === 0) {
    return (
      <section className="empty">
        <span className="empty-plus">+</span>
        <span className="serif cjk empty-title">{t('clean_page')}</span>
        <p style={{ whiteSpace: 'pre-line' }}>{t('empty_cta')}</p>
      </section>
    )
  }

  const cats = categoryTotals(expenses, categories)
  const total = cats.reduce((s, c) => s + c.total, 0)
  const perDay = daysElapsed > 0 ? total / daysElapsed : total
  const days = dailyTotals(expenses, period)
  const maxDay = Math.max(...days.map((d) => d.total), 1)
  const usagePct = Math.max(0, Math.min(100, Math.round(summary.ratio * 100)))

  return (
    <section>
      <div className="ring-card">
        <div className="ring" style={{ background: `conic-gradient(var(--fg) 0% ${usagePct}%, var(--track) ${usagePct}% 100%)` }}>
          <div className="ring-inner">
            <span className="serif ring-pct">{usagePct}</span>
            <span className="ring-label">{t('stat_usage_pct')}</span>
          </div>
        </div>
        <div className="ring-side">
          <span className="lbl">{t('stat_spent_this_month')}</span>
          <span className="serif ring-total">{money(summary.spent, currency)}</span>
          <span className="muted ring-meta">
            {t('stat_perday_daysleft', { p: money(summary.perDay || perDay, currency), d: summary.daysLeft })}
          </span>
        </div>
      </div>

      <p className="section-head" style={{ marginTop: 20 }}>{t('stat_by_category')}</p>
      <ul className="cat-stats">
        {cats.map((c) => (
          <li key={c.category}>
            <div className="cat-stat-top">
              <span className="cat-stat-name">
                <span className="dot" style={{ background: categoryColor(c.category, categories) }} />
                {categoryDisplay(c.category, lang)}
              </span>
              <span className="cat-stat-amt">
                {money(c.total, currency)} <span className="muted">{Math.round(c.pct * 100)}%</span>
              </span>
            </div>
            <div className="cat-bar">
              <div
                className="cat-bar-fill"
                style={{ width: `${Math.max(2, c.pct * 100)}%`, background: categoryColor(c.category, categories) }}
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
