import { Expense } from '../lib/types'
import { signedMoney, prettyDate } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { QUICK_CATEGORIES } from '../lib/categories'
import { useT, useLang, categoryLabel } from '../lib/i18n'

interface Props {
  expenses: Expense[]
  currency: string
  onDelete: (id: string) => void
}

export function ExpenseList({ expenses, currency, onDelete }: Props) {
  const t = useT()
  const lang = useLang()

  if (expenses.length === 0) {
    return (
      <section className="empty">
        <span className="serif cjk">{t('empty_title')}</span>
        <p>{t('empty_sub')}</p>
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
                <div className="r-title">{e.note || categoryLabel(e.category, lang)}</div>
                <div className="r-sub">
                  {categoryLabel(e.category, lang)} · {prettyDate(e.date, lang)}
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
