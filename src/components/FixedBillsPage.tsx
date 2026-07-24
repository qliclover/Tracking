import { Category, Recurring } from '../lib/types'
import { useT } from '../lib/i18n'
import { RecurringBills } from './RecurringBills'

interface Props {
  currency: string
  categories: Category[]
  recurring: Recurring[]
  onAdd: (input: Omit<Recurring, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, patch: Partial<Recurring>) => void
  onDelete: (id: string) => void
  onBack: () => void
}

export function FixedBillsPage({ currency, categories, recurring, onAdd, onUpdate, onDelete, onBack }: Props) {
  const t = useT()

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('fixed_bills')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      <RecurringBills
        currency={currency}
        categories={categories}
        recurring={recurring}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
