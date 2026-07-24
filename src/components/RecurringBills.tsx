import { useState } from 'react'
import { Recurring } from '../lib/types'
import { money } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { QUICK_CATEGORIES } from '../lib/categories'

interface Props {
  currency: string
  recurring: Recurring[]
  onAdd: (input: Omit<Recurring, 'id' | 'createdAt'>) => void
  onUpdate: (id: string, patch: Partial<Recurring>) => void
  onDelete: (id: string) => void
}

export function RecurringBills({ currency, recurring, onAdd, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [day, setDay] = useState('1')
  const [category, setCategory] = useState('Bills')
  const [error, setError] = useState('')

  function submit() {
    const amt = Number(amount)
    const d = Number(day)
    if (!name.trim()) return setError('Give the bill a name.')
    if (!Number.isFinite(amt) || amt <= 0) return setError('Enter an amount greater than 0.')
    if (!Number.isFinite(d) || d < 1 || d > 31) return setError('Day must be 1–31.')
    onAdd({
      name: name.trim(),
      amount: Math.round(amt * 100) / 100,
      category,
      dayOfMonth: Math.round(d),
      active: true,
    })
    setName('')
    setAmount('')
    setDay('1')
    setCategory('Bills')
    setError('')
    setOpen(false)
  }

  return (
    <section className="setting-block">
      <p className="section-head">Fixed bills</p>

      {recurring.length === 0 && !open && (
        <p className="muted" style={{ margin: '0 0 12px' }}>
          Rent, subscriptions… added here they're deducted automatically each cycle.
        </p>
      )}

      {recurring.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0 }}>
          {recurring.map((r) => (
            <li key={r.id} className="row">
              <div className="r-main">
                <span
                  className="dot"
                  style={{
                    background: categoryColor(r.category, QUICK_CATEGORIES),
                    opacity: r.active ? 1 : 0.35,
                  }}
                />
                <div className="r-text">
                  <div className="r-title" style={{ opacity: r.active ? 1 : 0.5 }}>{r.name}</div>
                  <div className="r-sub">Day {r.dayOfMonth} · {r.category}</div>
                </div>
              </div>
              <span className="r-amt" style={{ opacity: r.active ? 1 : 0.5 }}>
                {money(r.amount, currency)}
              </span>
              <button
                className="link"
                style={{ marginLeft: 8, fontSize: 12 }}
                onClick={() => onUpdate(r.id, { active: !r.active })}
              >
                {r.active ? 'Pause' : 'Resume'}
              </button>
              <button className="r-del" aria-label={`Delete ${r.name}`} onClick={() => onDelete(r.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="bill-form">
          <div className="field">
            <label className="flabel">Name</label>
            <input placeholder="e.g. Rent, Netflix" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="two">
            <div className="field">
              <label className="flabel">Amount</label>
              <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="field">
              <label className="flabel">Charged on day</label>
              <input inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} />
            </div>
          </div>
          <div className="cat-grid">
            {QUICK_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`cat ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                <span className="dot" style={{ background: categoryColor(c, QUICK_CATEGORIES) }} />
                {c}
              </button>
            ))}
          </div>
          {error && <p className="error">{error}</p>}
          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={() => { setOpen(false); setError('') }}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Add bill</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost" onClick={() => setOpen(true)}>+ Add a fixed bill</button>
      )}
    </section>
  )
}
