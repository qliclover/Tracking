import { ExpenseDraft } from '../lib/receipt'
import { money } from '../lib/format'
import { useT } from '../lib/i18n'

/** Small readout shown above the confirm form for scan/voice drafts. */
export function DraftHeader({ draft, currency }: { draft: ExpenseDraft; currency: string }) {
  const t = useT()
  return (
    <div style={{ marginBottom: 18 }}>
      <p className="section-head">{draft.source === 'scan' ? t('from_receipt') : t('from_voice')}</p>
      {draft.merchant && (
        <div className="r-title" style={{ marginBottom: 4 }}>
          {draft.merchant}
        </div>
      )}
      {draft.items && draft.items.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 4px', padding: 0 }}>
          {draft.items.slice(0, 6).map((it, i) => (
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
          {draft.items.length > 6 && (
            <li style={{ fontSize: 12, color: 'var(--faint)' }}>
              {t('more_items', { v: draft.items.length - 6 })}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
