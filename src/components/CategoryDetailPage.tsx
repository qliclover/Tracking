import { useState } from 'react'
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
  onRename: (oldName: string, newName: string) => void
  onDeleteCategory: (name: string) => void
  onDeleteExpense: (id: string) => void
  onBack: () => void
}

export function CategoryDetailPage({
  category,
  categories,
  expenses,
  currency,
  monthLabel,
  onRename,
  onDeleteCategory,
  onDeleteExpense,
  onBack,
}: Props) {
  const t = useT()
  const lang = useLang()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState('')

  const catExpenses = expenses.filter((e) => e.category === category.name)

  function startEdit() {
    setEditValue(categoryDisplay(category.name, lang))
    setError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError('')
  }

  function saveEdit() {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== categoryDisplay(category.name, lang)) {
      onRename(category.name, trimmed)
    }
    setEditing(false)
  }

  function handleDelete() {
    if (categories.length <= 1) {
      setError(t('category_last_one'))
      return
    }
    if (confirm(t('confirm_delete_category', { name: categoryDisplay(category.name, lang) }))) {
      onDeleteCategory(category.name)
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit()
                if (e.key === 'Escape') cancelEdit()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border-2)',
                color: 'var(--fg)',
                fontFamily: 'var(--serif-cjk)',
                fontWeight: 600,
                fontSize: 20,
                padding: '2px 0',
                outline: 'none',
                width: '100%',
              }}
            />
          ) : (
            <div className="wordmark serif cjk">{categoryDisplay(category.name, lang)}</div>
          )}
          <span className="month">
            {editing ? t('manage_categories') : `${t('records_count', { v: catExpenses.length })} · ${monthLabel}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, flex: 'none' }}>
          {editing ? (
            <>
              <button className="theme-toggle" onClick={cancelEdit}>{t('cancel')}</button>
              <button className="theme-toggle" onClick={saveEdit}>{t('done')}</button>
            </>
          ) : (
            <>
              <button className="theme-toggle" onClick={startEdit}>{t('category_edit')}</button>
              <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
            </>
          )}
        </div>
      </header>

      {editing && (
        <section className="setting-block">
          <p className="muted" style={{ lineHeight: 1.6, margin: '0 0 16px' }}>{t('category_hint')}</p>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-ghost danger-btn" onClick={handleDelete}>{t('delete_category')}</button>
        </section>
      )}

      {!editing && (
        catExpenses.length === 0 ? (
          <section className="empty">
            <p>{t('category_no_records')}</p>
          </section>
        ) : (
          <ExpenseList
            expenses={catExpenses}
            categories={categories}
            currency={currency}
            onDelete={onDeleteExpense}
            showFullDate
          />
        )
      )}

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
