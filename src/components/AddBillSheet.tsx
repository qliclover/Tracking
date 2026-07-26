import { useState } from 'react'
import { Category, Recurring } from '../lib/types'
import { categoryColor } from '../lib/categoryColors'
import { categoryDisplay } from '../lib/categories'
import { useT, useLang } from '../lib/i18n'

interface Props {
  open: boolean
  categories: Category[]
  onAdd: (input: Omit<Recurring, 'id' | 'createdAt'>) => void
  onClose: () => void
}

export function AddBillSheet({ open, categories, onAdd, onClose }: Props) {
  const t = useT()
  const lang = useLang()
  const defaultCategory = categories[3]?.name ?? categories[0]?.name ?? ''
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [day, setDay] = useState('1')
  const [category, setCategory] = useState(defaultCategory)
  const [error, setError] = useState('')

  if (!open) return null

  function submit() {
    const amt = Number(amount)
    const d = Number(day)
    if (!name.trim()) return setError(t('err_bill_name'))
    if (!Number.isFinite(amt) || amt <= 0) return setError(t('err_amount'))
    if (!Number.isFinite(d) || d < 1 || d > 31) return setError(t('err_day'))
    onAdd({
      name: name.trim(),
      amount: Math.round(amt * 100) / 100,
      category: category || defaultCategory,
      dayOfMonth: Math.round(d),
      active: true,
    })
    setName('')
    setAmount('')
    setDay('1')
    setCategory(defaultCategory)
    setError('')
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title serif cjk">{t('add_bill_title')}</h2>

        <div className="field">
          <label className="flabel">{t('bill_name')}</label>
          <input placeholder={t('bill_name_ph')} value={name} onChange={(e) => setName(e.target.value)} />
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
              {categoryDisplay(c.name, lang)}
            </button>
          ))}
        </div>

        <p className="hint-box">{t('bill_hint')}</p>

        {error && <p className="error">{error}</p>}

        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" onClick={submit}>{t('add_bill')}</button>
        </div>
      </div>
    </div>
  )
}
