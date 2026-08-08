import { Category, Recurring } from '../lib/types'
import { Period, occurrenceInPeriod, isoOf } from '../lib/period'
import { money } from '../lib/format'
import { categoryColor } from '../lib/categoryColors'
import { categoryDisplay } from '../lib/categories'
import { useT, useLang, TFn, Lang } from '../lib/i18n'

interface Props {
  currency: string
  categories: Category[]
  recurring: Recurring[]
  postedRecurring: string[]
  period: Period
  reserved: number
  onEdit: (rec: Recurring) => void
  onAddOpen: () => void
}

function statusText(rec: Recurring, period: Period, posted: string[], t: TFn): string {
  const occ = occurrenceInPeriod(rec.dayOfMonth, period)
  if (!occ) return ''
  const chargeISO = isoOf(occ)
  const today = new Date()
  const todayISO = isoOf(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  const key = `${rec.id}:${chargeISO}`
  if (posted.includes(key) || chargeISO < todayISO) return t('posted_status')
  if (chargeISO === todayISO) return t('today')
  const days = Math.round((occ.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000)
  return t('days_after', { v: days })
}

function dayOfLabel(rec: Recurring, lang: Lang, t: TFn): string {
  const cat = categoryDisplay(rec.category, lang)
  return t('day_of', { d: rec.dayOfMonth, c: cat })
}

function BillRow({
  rec,
  currency,
  categories,
  lang,
  t,
  status,
  dimmed,
  onEdit,
}: {
  rec: Recurring
  currency: string
  categories: Category[]
  lang: Lang
  t: TFn
  status?: string
  dimmed?: boolean
  onEdit: () => void
}) {
  return (
    <li className="row row-tap" role="button" tabIndex={0} onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit()
        }
      }}
    >
      <div className="r-main" style={dimmed ? { opacity: 0.5 } : undefined}>
        <span className="dot" style={{ background: categoryColor(rec.category, categories) }} />
        <div className="r-text">
          <div className="r-title">{rec.name}</div>
          <div className="r-sub">{dayOfLabel(rec, lang, t)}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right', opacity: dimmed ? 0.5 : 1 }}>
        <div className="r-amt serif">{money(rec.amount, currency)}</div>
        {status && <div className="bill-status">{status}</div>}
      </div>
      <span className="r-chev" aria-hidden="true">›</span>
    </li>
  )
}

export function BillsPage({
  currency,
  categories,
  recurring,
  postedRecurring,
  period,
  reserved,
  onEdit,
  onAddOpen,
}: Props) {
  const t = useT()
  const lang = useLang()
  const active = recurring.filter((r) => r.active)
  const paused = recurring.filter((r) => !r.active)

  return (
    <section>
      <div className="page-head">
        <div>
          <div className="wordmark serif cjk page-title">{t('fixed_bills')}</div>
          <div className="page-sub">{t('bills_count_short', { v: recurring.length })}</div>
        </div>
        <button type="button" className="round-btn round-btn-dark" aria-label={t('new_entry')} onClick={onAddOpen}>
          +
        </button>
      </div>

      <div className="reserved-hero">
        <span className="lbl reserved-hero-lbl">{t('reserved_this_month')}</span>
        <div className="serif reserved-hero-amt">{money(reserved, currency)}</div>
        <p className="reserved-hero-hint">{t('auto_charge_hint')}</p>
      </div>

      {active.length > 0 && (
        <>
          <p className="section-head" style={{ marginTop: 22 }}>{t('due_soon')}</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {active.map((r) => (
              <BillRow
                key={r.id}
                rec={r}
                currency={currency}
                categories={categories}
                lang={lang}
                t={t}
                status={statusText(r, period, postedRecurring, t)}
                onEdit={() => onEdit(r)}
              />
            ))}
          </ul>
        </>
      )}

      {paused.length > 0 && (
        <>
          <p className="section-head" style={{ marginTop: 22 }}>{t('paused_bills')}</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {paused.map((r) => (
              <BillRow
                key={r.id}
                rec={r}
                currency={currency}
                categories={categories}
                lang={lang}
                t={t}
                dimmed
                onEdit={() => onEdit(r)}
              />
            ))}
          </ul>
        </>
      )}

      {recurring.length === 0 && (
        <section className="empty">
          <p>{t('fixed_empty')}</p>
        </section>
      )}
    </section>
  )
}
