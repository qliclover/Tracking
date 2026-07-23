import { BudgetSummary, reminder } from '../lib/budget'
import { money } from '../lib/format'

interface Props {
  summary: BudgetSummary
  currency: string
}

export function BudgetCard({ summary, currency }: Props) {
  const pct = Math.min(100, Math.round(summary.ratio * 100))
  const overPct = Math.max(0, Math.round(summary.ratio * 100) - 100)

  return (
    <section className={`card budget-card level-${summary.level}`}>
      <div className="budget-headline">
        <div>
          <div className="label">Left to spend</div>
          <div className="big-number">{money(summary.remaining, currency)}</div>
        </div>
        <div className="budget-of">
          of {money(summary.budget, currency)}
        </div>
      </div>

      <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="budget-meta">
        <span>{money(summary.spent, currency)} spent</span>
        {overPct > 0 ? (
          <span className="over-tag">{overPct}% over</span>
        ) : (
          <span>{pct}% used</span>
        )}
      </div>

      <p className="reminder">{reminder(summary, currency)}</p>
    </section>
  )
}
