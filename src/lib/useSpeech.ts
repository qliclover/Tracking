import { useEffect, useRef, useState } from 'react'

// Minimal typings for the Web Speech API (not in the DOM lib by default).
interface SpeechRecognitionResultLike {
  0: { transcript: string }
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: { length: number; [i: number]: SpeechRecognitionResultLike }
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type SpeechCtor = new () => SpeechRecognitionLike

function getCtor(): SpeechCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor
    webkitSpeechRecognition?: SpeechCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export interface SpeechController {
  supported: boolean
  listening: boolean
  transcript: string
  error: string
  start: () => void
  stop: () => void
  reset: () => void
  setTranscript: (t: string) => void
}

/** Thin wrapper over the browser Web Speech API for dictation. */
export function useSpeech(lang = 'en-US'): SpeechController {
  const [supported] = useState(() => getCtor() !== null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const ref = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    return () => {
      try {
        ref.current?.stop()
      } catch {
        /* noop */
      }
    }
  }, [])

  function start() {
    const Ctor = getCtor()
    if (!Ctor) return
    setError('')
    setTranscript('')
    const rec = new Ctor()
    rec.lang = lang
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
      setTranscript(text)
    }
    rec.onerror = (ev) => {
      setError(ev.error === 'not-allowed' ? 'Microphone permission denied.' : 'Mic error.')
      setListening(false)
    }
    rec.onend = () => setListening(false)
    ref.current = rec
    rec.start()
    setListening(true)
  }

  function stop() {
    try {
      ref.current?.stop()
    } catch {
      /* noop */
    }
    setListening(false)
  }

  function reset() {
    setTranscript('')
    setError('')
  }

  return { supported, listening, transcript, error, start, stop, reset, setTranscript }
}
