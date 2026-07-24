import { useState } from 'react'
import { ExpenseDraft } from '../lib/receipt'
import { analyzeVoice, transcribeAudio } from '../lib/ai'
import { Category } from '../lib/types'
import { useAudioRecorder } from '../lib/useAudioRecorder'
import { useT } from '../lib/i18n'
import { ExpenseForm } from './ExpenseForm'
import { DraftHeader } from './DraftHeader'

interface Props {
  currency: string
  categories: Category[]
  onAdd: (draft: ExpenseDraft) => void
}

export function VoicePanel({ currency, categories, onAdd }: Props) {
  const t = useT()
  const recorder = useAudioRecorder()
  const [transcribing, setTranscribing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<ExpenseDraft | null>(null)
  const [typed, setTyped] = useState('')
  const [hasRecorded, setHasRecorded] = useState(false)
  const [typeMode, setTypeMode] = useState(!recorder.supported)

  const useTyping = typeMode || !recorder.supported

  async function toggleRecord() {
    setError('')
    if (recorder.recording) {
      const audio = await recorder.stop()
      if (!audio) return
      setTranscribing(true)
      try {
        setTyped(await transcribeAudio(audio))
        setHasRecorded(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('analyze_failed'))
      } finally {
        setTranscribing(false)
      }
    } else {
      setHasRecorded(false)
      setTyped('')
      await recorder.start()
    }
  }

  async function analyze() {
    const tr = typed.trim()
    if (!tr) return
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
          setTyped('')
          setHasRecorded(false)
        }}
        onSubmit={(d) => {
          onAdd(d)
          setDraft(null)
          setTyped('')
          setHasRecorded(false)
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
            className={`mic ${recorder.recording ? 'live' : ''}`}
            onClick={toggleRecord}
            disabled={transcribing}
          >
            <span className="mic-dot" />
            {recorder.recording ? t('listening') : transcribing ? t('transcribing') : t('tap_speak')}
          </button>
          {hasRecorded ? (
            <div className="field" style={{ marginTop: 12 }}>
              <label className="flabel" htmlFor="typed">{t('describe_expense')}</label>
              <input
                id="typed"
                placeholder={t('describe_ph')}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
            </div>
          ) : (
            <p className="transcript">
              <span className="muted">{t('voice_hint')}</span>
            </p>
          )}
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
        disabled={loading || transcribing || !typed.trim()}
      >
        {loading ? t('analyzing') : t('analyze')}
      </button>

      <div className="rule" />
      {(!recorder.supported || Boolean(recorder.error)) && (
        <p className="footer-credit" style={{ color: 'var(--danger)', marginBottom: 8 }}>
          {t('mic_unavailable')}
        </p>
      )}
      <p className="muted" style={{ lineHeight: 1.6, margin: 0 }}>{t('voice_desc')}</p>
    </div>
  )
}
