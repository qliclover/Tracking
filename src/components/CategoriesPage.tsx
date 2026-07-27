import { Category } from '../lib/types'
import { useT } from '../lib/i18n'
import { CategoryManager } from './CategoryManager'

interface Props {
  categories: Category[]
  onAdd: (name: string) => void
  onRename: (oldName: string, newName: string) => void
  onDelete: (name: string) => void
  onBack: () => void
}

export function CategoriesPage({ categories, onAdd, onRename, onDelete, onBack }: Props) {
  const t = useT()

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('manage_categories')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      <CategoryManager categories={categories} onAdd={onAdd} onRename={onRename} onDelete={onDelete} />

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
