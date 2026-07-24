import { useState } from 'react'
import { ExpenseDraft } from '../lib/receipt'
import { useT } from '../lib/i18n'
import { ExpenseForm } from './ExpenseForm'
import { ScanPanel } from './ScanPanel'
import { VoicePanel } from './VoicePanel'

type Mode = 'type' | 'scan' | 'speak'

interface Props {
  currency: string
  onAdd: (draft: ExpenseDraft) => void
}

const MODES: { key: Mode; tk: string }[] = [
  { key: 'type', tk: 'mode_type' },
  { key: 'scan', tk: 'mode_scan' },
  { key: 'speak', tk: 'mode_speak' },
]

export function EntrySection({ currency, onAdd }: Props) {
  const t = useT()
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
            {t(m.tk)}
          </button>
        ))}
      </div>

      {mode === 'type' && <ExpenseForm currency={currency} onSubmit={onAdd} />}
      {mode === 'scan' && <ScanPanel currency={currency} onAdd={onAdd} />}
      {mode === 'speak' && <VoicePanel currency={currency} onAdd={onAdd} />}
    </section>
  )
}
