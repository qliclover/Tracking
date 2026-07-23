import { FormEvent, useState } from 'react'
import { Expense } from '../lib/types'
import { todayISO } from '../lib/format'

interface Props {
  currency: string
  onAdd: (input: Omit<Expense, 'id' | 'createdAt'>) => void
}

const QUICK_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Fun', 'Other']

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
    <form className="card add-expense" onSubmit={submit}>
      <div className="row">
        <label className="field amount-field">
          <span className="field-label">Amount</span>
          <div className="amount-input">
            <span className="currency">{currency}</span>
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Expense amount"
            />
          </div>
        </label>
        <label className="field">
          <span className="field-label">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <div className="chips">
        {QUICK_CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            className={`chip ${category === c ? 'chip-active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <label className="field">
        <span className="field-label">Note (optional)</span>
        <input
          placeholder="e.g. lunch with team"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn btn-primary">
        Log expense
      </button>
    </form>
  )
}
