import { ExpenseDraft } from '../lib/receipt'
import { Category } from '../lib/types'
import { EntrySection, EntryMode } from './EntrySection'

interface Props {
  open: boolean
  onClose: () => void
  currency: string
  categories: Category[]
  mode: EntryMode
  onModeChange: (mode: EntryMode) => void
  onAdd: (draft: ExpenseDraft) => void
  prefillCategory?: string
  prefillKey?: number
}

/** Bottom sheet hosting manual/scan/voice entry — opened by the tab bar's center FAB. */
export function EntrySheet({ open, onClose, ...entryProps }: Props) {
  if (!open) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <EntrySection {...entryProps} />
      </div>
    </div>
  )
}
