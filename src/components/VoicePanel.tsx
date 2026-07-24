import { useState } from 'react'
import { ExpenseDraft } from '../lib/receipt'
import { analyzeVoice } from '../lib/ai'
import { useSpeech } from '../lib/useSpeech'
import { ExpenseForm } from './ExpenseForm'
import { DraftHeader } from './DraftHeader'

interface Props {
  currency: string
  onAdd: (draft: ExpenseDraft) => void
}

export function VoicePanel({ currency, onAdd }: Props) {
  const speech = useSpeech()
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
    const t = text.trim()
    if (!t) return
    if (speech.listening) speech.stop()
    setLoading(true)
    setError('')
    try {
      setDraft(await analyzeVoice(t))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not analyze.')
    } finally {
      setLoading(false)
    }
  }

  if (draft) {
    return (
      <ExpenseForm
        currency={currency}
        initial={draft}
        submitLabel="Save expense"
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
            {speech.listening ? 'Listening… tap to stop' : 'Tap and say what you spent'}
          </button>
          <p className="transcript">
            {speech.transcript || (
              <span className="muted">e.g. “午饭花了 25 块” / “12.40 on lunch today”</span>
            )}
          </p>
          <button type="button" className="link" onClick={() => setTypeMode(true)}>
            Type instead
          </button>
        </>
      ) : (
        <div className="field">
          <label className="flabel" htmlFor="typed">Describe the expense</label>
          <input
            id="typed"
            placeholder="例如：午饭花了 25 块 / 12.40 on lunch today"
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
        {loading ? 'Analyzing…' : 'Analyze'}
      </button>
    </div>
  )
}
