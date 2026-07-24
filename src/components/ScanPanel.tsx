import { useRef, useState } from 'react'
import { ExpenseDraft } from '../lib/receipt'
import { scanReceipt } from '../lib/ai'
import { Category } from '../lib/types'
import { useT } from '../lib/i18n'
import { ExpenseForm } from './ExpenseForm'
import { DraftHeader } from './DraftHeader'

interface Props {
  currency: string
  categories: Category[]
  onAdd: (draft: ExpenseDraft) => void
}

export function ScanPanel({ currency, categories, onAdd }: Props) {
  const t = useT()
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<ExpenseDraft | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImage(String(reader.result))
      setDraft(null)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  async function scan() {
    if (!image) return
    setLoading(true)
    setError('')
    try {
      setDraft(await scanReceipt(image, categories))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('scan_failed'))
    } finally {
      setLoading(false)
    }
  }

  if (draft) {
    return (
      <ExpenseForm
        currency={currency}
        categories={categories}
        initial={draft}
        submitKey="save_expense"
        header={<DraftHeader draft={draft} currency={currency} />}
        onCancel={() => {
          setDraft(null)
          setImage('')
        }}
        onSubmit={(d) => {
          onAdd(d)
          setDraft(null)
          setImage('')
        }}
      />
    )
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={pickFile}
        style={{ display: 'none' }}
      />

      {image ? (
        <div className="scan-preview" onClick={() => fileRef.current?.click()}>
          <img src={image} alt="" />
          <span className="scan-retake">{t('tap_retake')}</span>
        </div>
      ) : (
        <button type="button" className="dropzone" onClick={() => fileRef.current?.click()}>
          <span className="serif cjk" style={{ fontSize: 26 }}>{t('snap_receipt')}</span>
          <span className="muted">{t('snap_hint')}</span>
        </button>
      )}

      {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}

      {image && (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 16 }}
          onClick={scan}
          disabled={loading}
        >
          {loading ? t('reading') : t('read_receipt')}
        </button>
      )}

      <p className="muted" style={{ lineHeight: 1.6, margin: '22px 2px 0' }}>{t('scan_desc')}</p>

      <div className="rule" />
      <p className="footer-credit">{t('scan_powered')}</p>
    </div>
  )
}
