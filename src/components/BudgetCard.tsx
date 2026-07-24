import { BudgetSummary } from '../lib/budget'
import { money, splitMoney } from '../lib/format'

interface Props {
  summary: BudgetSummary
  currency: string
}

export function BudgetCard({ summary, currency }: Props) {
  const negative = summary.remaining < 0
  const { int, dec } = splitMoney(summary.remaining)
  const pct = Math.min(100, Math.round(summary.ratio * 100))
  const overPct = Math.max(0, Math.round(summary.ratio * 100) - 100)

  return (
    <section className={`level-${summary.level}`}>
      <p className="hero-label">{negative ? 'Over budget' : 'Left to spend'}</p>
      <div className={`hero-number ${negative ? 'neg' : ''}`}>
        <span className="cur">{negative ? '−' : ''}{currency}</span>
        <span>{int}</span>
        <span className="hero-dec">.{dec}</span>
      </div>

      <div className="split">
        <div className="col">
          <span className="lbl">Budget</span>
          <span className="amt">{money(summary.budget, currency)}</span>
        </div>
        <div className="divider" />
        <div className="col">
          <span className="lbl">Spent</span>
          <span className="amt">{money(summary.spent, currency)}</span>
        </div>
      </div>

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
          <span>{pct}% used</span>
          {overPct > 0 ? (
            <span className="over-tag">{overPct}% over</span>
          ) : (
            <span>
              {summary.daysLeft} day{summary.daysLeft === 1 ? '' : 's'} left
            </span>
          )}
        </div>
      </div>

      <Reminder summary={summary} currency={currency} />
    </section>
  )
}

function Reminder({ summary, currency }: Props) {
  const m = (n: number) => `${currency}${splitMoney(n).int}.${splitMoney(n).dec}`
  if (summary.budget <= 0) {
    return <p className="reminder">Set a monthly budget to begin.</p>
  }
  if (summary.level === 'over') {
    return (
      <p className="reminder">
        You're <em>{m(summary.remaining)}</em> past the line this month.
      </p>
    )
  }
  if (summary.level === 'warn') {
    return (
      <p className="reminder">
        Only <em>{m(summary.remaining)}</em> left — about {m(summary.perDay)} a day
        to finish the month.
      </p>
    )
  }
  return (
    <p className="reminder">
      About <em>{m(summary.perDay)}</em> a day keeps you on track.
    </p>
  )
}
