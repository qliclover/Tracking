import { BudgetSummary } from '../lib/budget'
import { money, splitMoney } from '../lib/format'
import { useT, useLang } from '../lib/i18n'

interface Props {
  summary: BudgetSummary
  currency: string
  year: number
  monthName: string
  onPrev: () => void
  onNext: () => void
}

export function BudgetCard({ summary, currency, year, monthName, onPrev, onNext }: Props) {
  const t = useT()
  const negative = summary.remaining < 0
  const { int, dec } = splitMoney(summary.remaining)
  const rawPct = Math.round(summary.ratio * 100)
  const fillPct = Math.min(100, rawPct)

  return (
    <section className={`level-${summary.level}`}>
      <div className="pager-row">
        <button type="button" className="pager-arrow" aria-label="Previous" onClick={onPrev}>‹</button>
        <div className="pager-center">
          <span className="pager-year">{year}</span>
          <span className="pager-month serif cjk">{monthName}</span>
        </div>
        <button type="button" className="pager-arrow" aria-label="Next" onClick={onNext}>›</button>
      </div>

      <div className="hero-block">
        <p className="hero-label">{negative ? t('over_budget') : t('left_to_spend')}</p>
        <div className={`hero-number ${negative ? 'neg' : ''}`}>
          <span className="cur">{negative ? '−' : ''}{currency}</span>
          <span>{int}</span>
          <span className="hero-dec">.{dec}</span>
        </div>

        <div className="meter">
          <div className="meter-row">
            <div className="track">
              <div className="fill" style={{ width: `${fillPct}%` }} />
            </div>
            <span className="meter-pct">{rawPct}%</span>
          </div>
        </div>

        <Reminder summary={summary} currency={currency} />
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="lbl">{t('budget')}</span>
          <span className="stat-card-amt">{money(summary.budget, currency)}</span>
        </div>
        <div className="stat-card">
          <span className="lbl">{t('spent')}</span>
          <span className="stat-card-amt">{money(summary.spent, currency)}</span>
        </div>
        <div className="stat-card">
          <span className="lbl">{t('reserved')}</span>
          <span className="stat-card-amt reserved">{money(summary.reserved, currency)}</span>
        </div>
      </div>
    </section>
  )
}

function Reminder({ summary, currency }: { summary: BudgetSummary; currency: string }) {
  const t = useT()
  const lang = useLang()
  const m = (n: number) => money(n, currency)
  const d = summary.daysLeft
  let text: string
  if (summary.budget <= 0) text = t('set_budget_first')
  else if (summary.level === 'over') text = t('rem_over', { v: m(summary.remaining), d })
  else if (summary.level === 'warn')
    text = t('rem_warn', { v: m(summary.remaining), p: m(summary.perDay), d })
  else text = t('rem_ok', { p: m(summary.perDay), d })
  return <p className="reminder" style={lang === 'en' ? { fontStyle: 'italic' } : undefined}>{text}</p>
}
