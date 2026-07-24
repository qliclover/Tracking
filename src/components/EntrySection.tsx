import { ExpenseDraft } from '../lib/receipt'
import { Category } from '../lib/types'
import { useT } from '../lib/i18n'
import { ExpenseForm } from './ExpenseForm'
import { ScanPanel } from './ScanPanel'
import { VoicePanel } from './VoicePanel'

export type EntryMode = 'type' | 'scan' | 'speak'

interface Props {
  currency: string
  categories: Category[]
  mode: EntryMode
  onModeChange: (mode: EntryMode) => void
  onAdd: (draft: ExpenseDraft) => void
}

const MODES: { key: EntryMode; tk: string }[] = [
  { key: 'type', tk: 'mode_type' },
  { key: 'scan', tk: 'mode_scan' },
  { key: 'speak', tk: 'mode_speak' },
]

export function EntrySection({ currency, categories, mode, onModeChange, onAdd }: Props) {
  const t = useT()

  return (
    <section>
      <div className="segmented">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`seg ${mode === m.key ? 'active' : ''}`}
            onClick={() => onModeChange(m.key)}
            type="button"
          >
            {t(m.tk)}
          </button>
        ))}
      </div>

      {mode === 'type' && <ExpenseForm currency={currency} categories={categories} onSubmit={onAdd} />}
      {mode === 'scan' && <ScanPanel currency={currency} categories={categories} onAdd={onAdd} />}
      {mode === 'speak' && <VoicePanel currency={currency} categories={categories} onAdd={onAdd} />}
    </section>
  )
}
