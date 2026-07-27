import { useState } from 'react'
import { Category, Expense } from '../lib/types'
import { useT } from '../lib/i18n'
import { CategoryManager } from './CategoryManager'
import { CategoryDetailPage } from './CategoryDetailPage'

interface Props {
  categories: Category[]
  expenses: Expense[]
  currency: string
  monthLabel: string
  onAdd: (name: string) => void
  onRename: (oldName: string, newName: string) => void
  onDelete: (name: string) => void
  onDeleteExpense: (id: string) => void
  onBack: () => void
}

export function CategoriesPage({
  categories,
  expenses,
  currency,
  monthLabel,
  onAdd,
  onRename,
  onDelete,
  onDeleteExpense,
  onBack,
}: Props) {
  const t = useT()
  const [selected, setSelected] = useState<string | null>(null)
  const selectedCategory = selected ? categories.find((c) => c.name === selected) : undefined

  if (selectedCategory) {
    return (
      <CategoryDetailPage
        category={selectedCategory}
        categories={categories}
        expenses={expenses}
        currency={currency}
        monthLabel={monthLabel}
        onRename={(oldName, newName) => {
          onRename(oldName, newName)
          setSelected(newName)
        }}
        onDeleteCategory={(name) => {
          onDelete(name)
          setSelected(null)
        }}
        onDeleteExpense={onDeleteExpense}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('manage_categories')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      <CategoryManager categories={categories} onAdd={onAdd} onOpen={setSelected} />

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
