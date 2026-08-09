import { Category, Expense } from '../lib/types'
import { ExpenseDraft } from '../lib/receipt'
import { useT } from '../lib/i18n'
import { ExpenseForm } from './ExpenseForm'

interface Props {
  open: boolean
  /** The expense being edited. Sheet renders nothing if null (there's no "add" mode here — use EntrySheet for that). */
  editing: Expense | null
  currency: string
  categories: Category[]
  onSave: (id: string, draft: ExpenseDraft) => void
  onDelete: (id: string) => void
  onClose: () => void
}

/** Bottom sheet for viewing/editing a single ledger entry — opened by tapping a row in ExpenseList. */
export function ExpenseSheet({ open, editing, currency, categories, onSave, onDelete, onClose }: Props) {
  const t = useT()

  if (!open || !editing) return null

  function remove() {
    if (!editing) return
    if (!confirm(t('confirm_delete_expense'))) return
    onDelete(editing.id)
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title serif cjk">{t('edit_expense_title')}</h2>

        <ExpenseForm
          key={editing.id}
          currency={currency}
          categories={categories}
          initial={{
            amount: editing.amount,
            category: editing.category,
            note: editing.note ?? '',
            date: editing.date,
            merchant: editing.merchant,
            items: editing.items,
            // A recurring-sourced entry becomes a manual one once hand-edited.
            source: editing.source === 'recurring' ? 'manual' : editing.source,
          }}
          submitKey="save_expense"
          onCancel={onClose}
          onSubmit={(draft) => {
            onSave(editing.id, draft)
            onClose()
          }}
        />

        <div className="sheet-extra-actions">
          <button className="link danger" onClick={remove}>{t('delete_expense')}</button>
        </div>
      </div>
    </div>
  )
}
