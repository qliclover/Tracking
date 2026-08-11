import { Category, Expense } from '../lib/types'
import { categoryDisplay } from '../lib/categories'
import { useT, useLang } from '../lib/i18n'
import { ExpenseList } from './ExpenseList'

interface Props {
  category: Category
  categories: Category[]
  expenses: Expense[]
  currency: string
  monthLabel: string
  onDeleteExpense: (id: string) => void
  onOpenExpense: (expense: Expense) => void
  onBack: () => void
}

/** Browse view for one category's expenses this period — reached by tapping a row in
 * Stats' "by category" breakdown. Renaming/deleting the *category* itself lives in
 * Settings > Categories, not here — but individual expense rows are still tappable to edit. */
export function CategoryRecordsPage({ category, categories, expenses, currency, monthLabel, onDeleteExpense, onOpenExpense, onBack }: Props) {
  const t = useT()
  const lang = useLang()
  const catExpenses = expenses.filter((e) => e.category === category.name)

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif cjk">{categoryDisplay(category.name, lang)}</div>
          <span className="month">{t('records_count', { v: catExpenses.length })} · {monthLabel}</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      {catExpenses.length === 0 ? (
        <section className="empty">
          <span className="empty-plus">+</span>
          <span className="serif cjk empty-title">{t('clean_page')}</span>
          <p style={{ whiteSpace: 'pre-line' }}>{t('category_no_records')}</p>
        </section>
      ) : (
        <ExpenseList
          expenses={catExpenses}
          categories={categories}
          currency={currency}
          onDelete={onDeleteExpense}
          showFullDate
          onOpen={onOpenExpense}
        />
      )}

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
