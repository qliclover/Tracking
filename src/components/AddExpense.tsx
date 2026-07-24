import { FormEvent, useState } from 'react'
import { Expense } from '../lib/types'
import { todayISO } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'

interface Props {
  currency: string
  onAdd: (input: Omit<Expense, 'id' | 'createdAt'>) => void
}

export const QUICK_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Fun', 'Other']

export function AddExpense({ currency, onAdd }: Props) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }
    onAdd({
      amount: Math.round(value * 100) / 100,
      category: category.trim() || 'Other',
      note: note.trim() || undefined,
      date,
    })
    setAmount('')
    setNote('')
    setError('')
  }

  return (
    <form onSubmit={submit}>
      <p className="section-head">New entry</p>

      <div className="field amount">
        <label className="flabel" htmlFor="amount">Amount</label>
        <div className="amount-wrap">
          <span className="cur">{currency}</span>
          <input
            id="amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="cat-grid">
        {QUICK_CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            className={`cat ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
          >
            <span className="dot" style={{ background: categoryColor(c, QUICK_CATEGORIES) }} />
            {c}
          </button>
        ))}
      </div>

      <div className="two">
        <div className="field">
          <label className="flabel" htmlFor="note">Note</label>
          <input
            id="note"
            placeholder="optional"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn btn-primary">
        Record it
      </button>
    </form>
  )
}
