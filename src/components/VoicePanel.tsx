import { useState } from 'react'
import { ExpenseDraft } from '../lib/receipt'
import { analyzeVoice } from '../lib/ai'
import { Category } from '../lib/types'
import { useSpeech } from '../lib/useSpeech'
import { useT, useLang } from '../lib/i18n'
import { ExpenseForm } from './ExpenseForm'
import { DraftHeader } from './DraftHeader'

interface Props {
  currency: string
  categories: Category[]
  onAdd: (draft: ExpenseDraft) => void
}

export function VoicePanel({ currency, categories, onAdd }: Props) {
  const t = useT()
  const lang = useLang()
  const speech = useSpeech(lang === 'zh' ? 'zh-CN' : 'en-US')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<ExpenseDraft | null>(null)
  const [typed, setTyped] = useState('')
  const [typeMode, setTypeMode] = useState(!speech.supported)

  // Browser dictation relies on Google servers and fails in mainland China —
  // fall back to typing automatically if the mic errors.
  const useTyping = typeMode || !speech.supported || Boolean(speech.error)
  const text = useTyping ? typed : speech.transcript

  async function analyze() {
    const tr = text.trim()
    if (!tr) return
    if (speech.listening) speech.stop()
    setLoading(true)
    setError('')
    try {
      setDraft(await analyzeVoice(tr, categories))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('analyze_failed'))
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
          speech.reset()
          setTyped('')
        }}
        onSubmit={(d) => {
          onAdd(d)
          setDraft(null)
          speech.reset()
          setTyped('')
        }}
      />
    )
  }

  return (
    <div>
      {!useTyping ? (
        <>
          <button
            type="button"
            className={`mic ${speech.listening ? 'live' : ''}`}
            onClick={() => (speech.listening ? speech.stop() : speech.start())}
          >
            <span className="mic-dot" />
            {speech.listening ? t('listening') : t('tap_speak')}
          </button>
          <p className="transcript">
            {speech.transcript || <span className="muted">{t('voice_hint')}</span>}
          </p>
          <button type="button" className="link" onClick={() => setTypeMode(true)}>
            {t('type_instead')}
          </button>
        </>
      ) : (
        <div className="field">
          <label className="flabel" htmlFor="typed">{t('describe_expense')}</label>
          <input
            id="typed"
            placeholder={t('describe_ph')}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
      )}

      {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}

      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: 16 }}
        onClick={analyze}
        disabled={loading || !text.trim()}
      >
        {loading ? t('analyzing') : t('analyze')}
      </button>

      <div className="rule" />
      {(!speech.supported || Boolean(speech.error)) && (
        <p className="footer-credit" style={{ color: 'var(--danger)', marginBottom: 8 }}>
          {t('mic_unavailable')}
        </p>
      )}
      <p className="muted" style={{ lineHeight: 1.6, margin: 0 }}>{t('voice_desc')}</p>
    </div>
  )
}
