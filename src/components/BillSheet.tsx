import { useEffect, useState } from 'react'
import { Category, Recurring } from '../lib/types'
import { categoryColor } from '../lib/categoryColors'
import { categoryDisplay } from '../lib/categories'
import { useT, useLang } from '../lib/i18n'
import { MAX_AMOUNT } from '../lib/format'
import { useEscapeKey } from '../lib/useEscapeKey'

interface Props {
  open: boolean
  /** The bill being edited, or null to add a new one. */
  editing: Recurring | null
  categories: Category[]
  onAdd: (input: Omit<Recurring, 'id' | 'createdAt'>) => void
  onSave: (id: string, patch: Partial<Recurring>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function BillSheet({ open, editing, categories, onAdd, onSave, onDelete, onClose }: Props) {
  const t = useT()
  const lang = useLang()
  const defaultCategory = categories[3]?.name ?? categories[0]?.name ?? ''
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [day, setDay] = useState('1')
  const [category, setCategory] = useState(defaultCategory)
  const [active, setActive] = useState(true)
  const [error, setError] = useState('')

  // Load the bill's values every time the sheet opens (or switches bills).
  useEffect(() => {
    if (!open) return
    setName(editing?.name ?? '')
    setAmount(editing ? String(editing.amount) : '')
    setDay(String(editing?.dayOfMonth ?? 1))
    setCategory(editing?.category ?? defaultCategory)
    setActive(editing?.active ?? true)
    setError('')
  }, [open, editing?.id])

  useEscapeKey(open, onClose)

  if (!open) return null

  function submit() {
    const amt = Number(amount)
    const d = Number(day)
    if (!name.trim()) return setError(t('err_bill_name'))
    if (!Number.isFinite(amt) || amt <= 0 || amt > MAX_AMOUNT) return setError(t('err_amount'))
    if (!Number.isFinite(d) || d < 1 || d > 31) return setError(t('err_day'))
    const fields = {
      name: name.trim(),
      amount: Math.round(amt * 100) / 100,
      category: category || defaultCategory,
      dayOfMonth: Math.round(d),
      active,
    }
    if (editing) onSave(editing.id, fields)
    else onAdd(fields)
    onClose()
  }

  function remove() {
    if (!editing) return
    if (!confirm(t('confirm_delete_bill', { name: editing.name }))) return
    onDelete(editing.id)
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title serif cjk">{editing ? t('edit_bill_title') : t('add_bill_title')}</h2>

        <div className="field">
          <label className="flabel">{t('bill_name')}</label>
          <input
            placeholder={t('bill_name_ph')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
        </div>

        <div className="two">
          <div className="field">
            <label className="flabel">{t('amount')}</label>
            <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="field">
            <label className="flabel">{t('charged_day')}</label>
            <input inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} />
          </div>
        </div>

        <p className="flabel">{t('manage_categories')}</p>
        <div className="cat-grid">
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`cat ${category === c.name ? 'active' : ''}`}
              onClick={() => setCategory(c.name)}
            >
              <span className="dot" style={{ background: categoryColor(c.name, categories) }} />
              <span>{categoryDisplay(c.name, lang)}</span>
            </button>
          ))}
        </div>

        <p className="hint-box">{active ? t('bill_hint') : t('bill_paused_hint')}</p>

        {error && <p className="error">{error}</p>}

        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={submit}>{editing ? t('save_bill') : t('add_bill')}</button>
        </div>

        {editing && (
          <div className="sheet-extra-actions">
            <button className="link" onClick={() => setActive((v) => !v)}>
              {active ? t('pause') : t('resume')}
            </button>
            <button className="link danger" onClick={remove}>{t('delete_bill')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
