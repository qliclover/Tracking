import { useRef, useState } from 'react'
import { ExpenseDraft } from '../lib/receipt'
import { scanReceipt } from '../lib/ai'
import { Category } from '../lib/types'
import { useT } from '../lib/i18n'
import { compressImage } from '../lib/image'
import { ExpenseForm } from './ExpenseForm'
import { DraftHeader } from './DraftHeader'

const MAX_IMAGES = 6

interface Props {
  currency: string
  categories: Category[]
  onAdd: (draft: ExpenseDraft) => void
}

export function ScanPanel({ currency, categories, onAdd }: Props) {
  const t = useT()
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<ExpenseDraft | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES)
    if (!files.length) return
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
          }),
      ),
    ).then(async (raw) => {
      const compressed = await Promise.all(
        raw.map((dataUrl) => compressImage(dataUrl).catch(() => dataUrl)),
      )
      setImages(compressed)
      setDraft(null)
      setError('')
    })
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function scan() {
    if (!images.length) return
    setLoading(true)
    setError('')
    try {
      setDraft(await scanReceipt(images, categories))
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
        header={<DraftHeader draft={draft} currency={currency} limit={6} />}
        onCancel={() => {
          setDraft(null)
          setImages([])
        }}
        onSubmit={(d) => {
          onAdd(d)
          setDraft(null)
          setImages([])
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
        multiple
        onChange={pickFiles}
        style={{ display: 'none' }}
      />

      {images.length > 0 ? (
        <div>
          <div className="scan-multi">
            {images.map((src, i) => (
              <div className="scan-thumb" key={i}>
                <img src={src} alt="" />
                <button type="button" className="scan-thumb-remove" aria-label={t('remove')} onClick={() => removeImage(i)}>
                  ×
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button type="button" className="scan-thumb-add" onClick={() => fileRef.current?.click()}>
                +
              </button>
            )}
          </div>
          {images.length > 1 && <p className="muted" style={{ marginTop: 8 }}>{t('scan_multi_hint', { v: images.length })}</p>}
        </div>
      ) : (
        <button type="button" className="dropzone" onClick={() => fileRef.current?.click()}>
          <span className="serif cjk" style={{ fontSize: 26 }}>{t('snap_receipt')}</span>
          <span className="muted">{t('snap_hint')}</span>
        </button>
      )}

      {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}

      {images.length > 0 && (
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
