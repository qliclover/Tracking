import { BudgetSummary } from '../lib/budget'
import { money, splitMoney } from '../lib/format'
import { useT } from '../lib/i18n'

interface Props {
  summary: BudgetSummary
  currency: string
}

export function BudgetCard({ summary, currency }: Props) {
  const t = useT()
  const negative = summary.remaining < 0
  const { int, dec } = splitMoney(summary.remaining)
  const pct = Math.min(100, Math.round(summary.ratio * 100))
  const overPct = Math.max(0, Math.round(summary.ratio * 100) - 100)

  return (
    <section className={`level-${summary.level}`}>
      <p className="hero-label">{negative ? t('over_budget') : t('left_to_spend')}</p>
      <div className={`hero-number ${negative ? 'neg' : ''}`}>
        <span className="cur">{negative ? '−' : ''}{currency}</span>
        <span>{int}</span>
        <span className="hero-dec">.{dec}</span>
      </div>

      <div className="split">
        <div className="col">
          <span className="lbl">{t('budget')}</span>
          <span className="amt">{money(summary.budget, currency)}</span>
        </div>
        <div className="divider" />
        <div className="col">
          <span className="lbl">{t('spent')}</span>
          <span className="amt">{money(summary.spent, currency)}</span>
        </div>
      </div>

      {summary.reserved > 0 && (
        <p className="bills-line">
          <span className="dot bills-dot" />{' '}
          {renderBills(t('bills_reserved', { v: money(summary.reserved, currency) }))}
        </p>
      )}

      <div className="meter">
        <div
          className="track"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="meter-meta">
          <span>{t('pct_used', { v: pct })}</span>
          {overPct > 0 ? (
            <span className="over-tag">{t('pct_over', { v: overPct })}</span>
          ) : (
            <span>{t('days_left', { v: summary.daysLeft })}</span>
          )}
        </div>
      </div>

      <Reminder summary={summary} currency={currency} />
    </section>
  )
}

// Bold the money amount inside the reserved line.
function renderBills(text: string) {
  const m = text.match(/([\d.,¥$€£₩]+)/)
  if (!m) return text
  const [before, after] = text.split(m[0])
  return (
    <span>
      {before}
      <strong>{m[0]}</strong>
      {after}
    </span>
  )
}

function Reminder({ summary, currency }: Props) {
  const t = useT()
  const m = (n: number) => money(n, currency)
  let text: string
  if (summary.budget <= 0) text = t('set_budget_first')
  else if (summary.level === 'over') text = t('rem_over', { v: m(summary.remaining) })
  else if (summary.level === 'warn')
    text = t('rem_warn', { v: m(summary.remaining), p: m(summary.perDay) })
  else text = t('rem_ok', { p: m(summary.perDay) })
  return <p className="reminder">{text}</p>
}
