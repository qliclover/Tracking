import { useEffect, useState } from 'react'
import { Category, Expense } from '../lib/types'
import { signedMoney, prettyDate } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { categoryDisplay } from '../lib/categories'
import { useT, useLang } from '../lib/i18n'

const PAGE_SIZE = 15

interface Props {
  expenses: Expense[]
  categories: Category[]
  currency: string
  onDelete: (id: string) => void
}

export function ExpenseList({ expenses, categories, currency, onDelete }: Props) {
  const t = useT()
  const lang = useLang()
  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage(0)
  }, [expenses])

  if (expenses.length === 0) {
    return (
      <section className="empty">
        <p>{t('empty_sub')}</p>
      </section>
    )
  }

  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages - 1)
  const shown = expenses.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE)

  return (
    <section>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {shown.map((e) => (
          <li key={e.id} className="row">
            <div className="r-main">
              <span
                className="dot"
                style={{ background: categoryColor(e.category, categories) }}
              />
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

      {totalPages > 1 && (
        <div className="pager">
          <button
            className="link"
            disabled={clampedPage === 0}
            onClick={() => setPage(clampedPage - 1)}
          >
            {t('page_prev')}
          </button>
          <span className="muted">{t('page_of', { a: clampedPage + 1, b: totalPages })}</span>
          <button
            className="link"
            disabled={clampedPage >= totalPages - 1}
            onClick={() => setPage(clampedPage + 1)}
          >
            {t('page_next')}
          </button>
        </div>
      )}
    </section>
  )
}
