import { useState } from 'react'
import { Category } from '../lib/types'
import { categoryDisplay } from '../lib/categories'
import { useT, useLang } from '../lib/i18n'

interface Props {
  categories: Category[]
  onAdd: (name: string) => void
  onOpen: (name: string) => void
}

export function CategoryManager({ categories, onAdd, onOpen }: Props) {
  const t = useT()
  const lang = useLang()
  const [newName, setNewName] = useState('')

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
          <li key={c.name}>
            <button
              type="button"
              className="row"
              style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => onOpen(c.name)}
            >
              <div className="r-main">
                <span className="dot" style={{ background: c.color }} />
                <div className="r-title">{categoryDisplay(c.name, lang)}</div>
              </div>
              <span className="muted" style={{ fontSize: 16 }}>›</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="two">
        <div className="field" style={{ flex: 2, marginBottom: 0 }}>
          <input
            placeholder={t('category_add_ph')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
        </div>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={add}>
          {t('category_add')}
        </button>
      </div>
    </section>
  )
}
