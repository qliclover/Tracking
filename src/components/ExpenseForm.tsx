import { FormEvent, ReactNode, useState } from 'react'
import { ExpenseDraft } from '../lib/receipt'
import { todayISO } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { categoryDisplay } from '../lib/categories'
import { Category } from '../lib/types'
import { useT, useLang } from '../lib/i18n'

interface Props {
  currency: string
  categories: Category[]
  initial?: Partial<ExpenseDraft>
  submitKey?: string
  onSubmit: (draft: ExpenseDraft) => void
  onCancel?: () => void
  header?: ReactNode
}

export function ExpenseForm({
  currency,
  categories,
  initial,
  submitKey = 'record_it',
  onSubmit,
  onCancel,
  header,
}: Props) {
  const t = useT()
  const lang = useLang()
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '')
  const [category, setCategory] = useState(initial?.category ?? categories[0]?.name ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [error, setError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('err_amount'))
      return
    }
    onSubmit({
      amount: Math.round(value * 100) / 100,
      category: category.trim() || categories[categories.length - 1]?.name || '',
      note: note.trim(),
      date,
      merchant: initial?.merchant,
      items: initial?.items,
      source: initial?.source ?? 'manual',
    })
    if (!onCancel) {
      setAmount('')
      setNote('')
    }
    setError('')
  }

  return (
    <form onSubmit={submit}>
      {header}

      <div className="field amount">
        <label className="flabel" htmlFor="amount">{t('amount')}</label>
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
        {categories.map((c) => (
          <button
            type="button"
            key={c.name}
            className={`cat ${category === c.name ? 'active' : ''}`}
            onClick={() => setCategory(c.name)}
          >
            <span className="dot" style={{ background: categoryColor(c.name, categories) }} />
            {categoryDisplay(c.name, lang)}
          </button>
        ))}
      </div>

      <div className="two">
        <div className="field">
          <label className="flabel" htmlFor="note">{t('note')}</label>
          <input
            id="note"
            placeholder={t('optional')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="flabel" htmlFor="date">{t('date')}</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className={onCancel ? 'sheet-actions' : ''}>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {t('discard')}
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {t(submitKey)}
        </button>
      </div>
    </form>
  )
}
