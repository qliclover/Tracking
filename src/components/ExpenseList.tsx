import { Expense } from '../lib/types'
import { signedMoney, prettyDate } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { QUICK_CATEGORIES } from '../lib/categories'

interface Props {
  expenses: Expense[]
  currency: string
  onDelete: (id: string) => void
}

export function ExpenseList({ expenses, currency, onDelete }: Props) {
  if (expenses.length === 0) {
    return (
      <section className="empty">
        <span className="serif">A clean page.</span>
        <p>Record your first expense above.</p>
      </section>
    )
  }

  return (
    <section>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {expenses.map((e) => (
          <li key={e.id} className="row">
            <div className="r-main">
              <span
                className="dot"
                style={{ background: categoryColor(e.category, QUICK_CATEGORIES) }}
              />
              <div className="r-text">
                <div className="r-title">{e.note || e.category}</div>
                <div className="r-sub">
                  {e.category} · {prettyDate(e.date)}
                </div>
              </div>
            </div>
            <span className="r-amt">{signedMoney(-e.amount, currency)}</span>
            <button
              className="r-del"
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
