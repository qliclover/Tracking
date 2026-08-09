import { money } from '../lib/format'
import { useT } from '../lib/i18n'

interface DraftLike {
  source?: 'manual' | 'scan' | 'voice' | 'recurring'
  merchant?: string
  items?: { name: string; price: number }[]
}

/** Small readout shown above the confirm form for scan/voice drafts, and above the
 * edit form for a saved expense that has an itemized receipt. `limit` truncates the
 * list with a "+N more" hint; omit it to always show every item (the saved-expense case). */
export function DraftHeader({ draft, currency, limit }: { draft: DraftLike; currency: string; limit?: number }) {
  const t = useT()
  const items = draft.items ?? []
  const shown = limit ? items.slice(0, limit) : items
  return (
    <div style={{ marginBottom: 18 }}>
      <p className="section-head">{draft.source === 'scan' ? t('from_receipt') : t('from_voice')}</p>
      {draft.merchant && (
        <div className="r-title" style={{ marginBottom: 4 }}>
          {draft.merchant}
        </div>
      )}
      {items.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 4px', padding: 0 }}>
          {shown.map((it, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                color: 'var(--muted)',
                padding: '2px 0',
              }}
            >
              <span>{it.name}</span>
              <span>{money(it.price, currency)}</span>
            </li>
          ))}
          {limit && items.length > limit && (
            <li style={{ fontSize: 12, color: 'var(--faint)' }}>
              {t('more_items', { v: items.length - limit })}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
