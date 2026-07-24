import { useCallback, useRef, useState } from 'react'

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  for (const candidate of ['audio/mp4', 'audio/aac', 'audio/webm']) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate
  }
  return ''
}

/**
 * Records a short clip via MediaRecorder and resolves it as a data URL.
 * Used instead of the browser SpeechRecognition API, which WKWebView (and
 * mainland-China networks, for Google's dictation servers) doesn't support.
 */
export function useAudioRecorder() {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const stopResolveRef = useRef<((url: string) => void) | null>(null)

  const supported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'

  const start = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/mp4' })
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        const reader = new FileReader()
        reader.onload = () => {
          stopResolveRef.current?.(String(reader.result))
          stopResolveRef.current = null
        }
        reader.readAsDataURL(blob)
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setError('denied')
      setRecording(false)
    }
  }, [])

  const stop = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        resolve('')
        return
      }
      stopResolveRef.current = resolve
      recorder.stop()
      setRecording(false)
    })
  }, [])

  return { supported, recording, error, start, stop }
}
