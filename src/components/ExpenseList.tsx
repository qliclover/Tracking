import { Expense } from '../lib/types'
import { money, prettyDate } from '../lib/format'

interface Props {
  expenses: Expense[]
  currency: string
  onDelete: (id: string) => void
}

export function ExpenseList({ expenses, currency, onDelete }: Props) {
  if (expenses.length === 0) {
    return (
      <section className="card empty">
        <p>No expenses yet this month.</p>
        <p className="muted">Log your first one above and watch the budget update.</p>
      </section>
    )
  }

  return (
    <section className="card list">
      <h2 className="list-title">This month</h2>
      <ul>
        {expenses.map((e) => (
          <li key={e.id} className="expense-row">
            <div className="expense-main">
              <span className="expense-cat">{e.category}</span>
              {e.note && <span className="expense-note">{e.note}</span>}
            </div>
            <div className="expense-side">
              <span className="expense-amount">{money(e.amount, currency)}</span>
              <span className="expense-date">{prettyDate(e.date)}</span>
            </div>
            <button
              className="btn-icon"
              aria-label={`Delete ${e.category} expense`}
              onClick={() => onDelete(e.id)}
              title="Delete"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
