import { useState } from 'react'
import { ExpenseDraft } from '../lib/receipt'
import { ExpenseForm } from './ExpenseForm'
import { ScanPanel } from './ScanPanel'
import { VoicePanel } from './VoicePanel'

type Mode = 'type' | 'scan' | 'speak'

interface Props {
  currency: string
  onAdd: (draft: ExpenseDraft) => void
}

const MODES: { key: Mode; label: string }[] = [
  { key: 'type', label: 'Type' },
  { key: 'scan', label: 'Scan' },
  { key: 'speak', label: 'Speak' },
]

export function EntrySection({ currency, onAdd }: Props) {
  const [mode, setMode] = useState<Mode>('type')

  return (
    <section>
      <div className="segmented">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`seg ${mode === m.key ? 'active' : ''}`}
            onClick={() => setMode(m.key)}
            type="button"
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'type' && <ExpenseForm currency={currency} onSubmit={onAdd} />}
      {mode === 'scan' && <ScanPanel currency={currency} onAdd={onAdd} />}
      {mode === 'speak' && <VoicePanel currency={currency} onAdd={onAdd} />}
    </section>
  )
}
