import { useState } from 'react'
import { Category } from '../lib/types'
import { categoryDisplay } from '../lib/categories'
import { useT, useLang } from '../lib/i18n'

interface Props {
  categories: Category[]
  onAdd: (name: string) => void
  onRename: (oldName: string, newName: string) => void
  onDelete: (name: string) => void
}

export function CategoryManager({ categories, onAdd, onRename, onDelete }: Props) {
  const t = useT()
  const lang = useLang()
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  function startEdit(name: string) {
    setEditing(name)
    setEditValue(categoryDisplay(name, lang))
    setError('')
  }

  function commitEdit() {
    // Only a real rename if the value actually changed from what's shown —
    // otherwise re-saving a translated built-in name would freeze it as
    // literal text and stop it following the language toggle.
    if (editing && editValue.trim() && editValue.trim() !== categoryDisplay(editing, lang)) {
      onRename(editing, editValue.trim())
    }
    setEditing(null)
  }

  function remove(name: string) {
    if (categories.length <= 1) {
      setError(t('category_last_one'))
      return
    }
    onDelete(name)
  }

  function add() {
    if (!newName.trim()) return
    onAdd(newName)
    setNewName('')
  }

  return (
    <section className="setting-block">
      <p className="section-head">{t('manage_categories')}</p>

      <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0 }}>
        {categories.map((c) => (
          <li key={c.name} className="row">
            <div className="r-main">
              <span className="dot" style={{ background: c.color }} />
              {editing === c.name ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit()
                    if (e.key === 'Escape') setEditing(null)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border-2)',
                    color: 'var(--fg)',
                    fontFamily: 'inherit',
                    fontSize: 17,
                    padding: '2px 0',
                    outline: 'none',
                    width: '100%',
                  }}
                />
              ) : (
                <div className="r-title">{categoryDisplay(c.name, lang)}</div>
              )}
            </div>
            {editing !== c.name && (
              <>
                <button className="link" style={{ marginLeft: 8, fontSize: 12 }} onClick={() => startEdit(c.name)}>
                  {t('category_rename')}
                </button>
                <button className="r-del" aria-label={t('remove')} onClick={() => remove(c.name)}>×</button>
              </>
            )}
          </li>
        ))}
        <li className="row add-category-row">
          <input
            className="add-category-input"
            placeholder={t('category_add_ph')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button
            type="button"
            className="round-btn round-btn-dark"
            aria-label={t('category_add')}
            onClick={add}
            disabled={!newName.trim()}
          >
            +
          </button>
        </li>
      </ul>

      {error && <p className="error">{error}</p>}

      <p className="muted" style={{ lineHeight: 1.6, margin: '4px 0 0' }}>{t('category_hint')}</p>
    </section>
  )
}
