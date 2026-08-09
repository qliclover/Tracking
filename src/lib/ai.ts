import { ExpenseDraft, Receipt, receiptSummary } from './receipt'
import { todayISO, safeDate } from './format'
import { Category } from './types'
import { resolveAiCategory } from './categories'

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error(
      "Can't reach the AI service. Run `vercel dev` locally, or deploy to enable it.",
    )
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || `Request failed (${res.status}).`)
  }
  return (await res.json()) as T
}

/** Send one or more photos of the same receipt (data URLs) and normalize the result into a draft. */
export async function scanReceipt(imageDataUrls: string[], categories: readonly Category[]): Promise<ExpenseDraft> {
  const today = todayISO()
  const { receipt } = await postJSON<{ receipt: Receipt }>('/api/receipt', {
    images: imageDataUrls,
    today,
  })
  return {
    amount: Math.abs(Number(receipt.total) || 0),
    category: resolveAiCategory(receipt.category, categories),
    note: receiptSummary(receipt),
    date: safeDate(receipt.date, today),
    merchant: receipt.merchant || undefined,
    items: receipt.items?.length ? receipt.items : undefined,
    source: 'scan',
  }
}

/** Send a recorded voice clip (data URL) and return the transcribed text. */
export async function transcribeAudio(audioDataUrl: string): Promise<string> {
  const { transcript } = await postJSON<{ transcript: string }>('/api/transcribe', {
    audio: audioDataUrl,
  })
  return transcript
}

interface VoiceDraft {
  amount: number
  category: string
  note: string
  date: string
  merchant: string | null
}

/** Send a spoken transcript and normalize the result into a draft. */
export async function analyzeVoice(transcript: string, categories: readonly Category[]): Promise<ExpenseDraft> {
  const today = todayISO()
  const { draft } = await postJSON<{ draft: VoiceDraft }>('/api/voice', { transcript, today })
  return {
    amount: Math.abs(Number(draft.amount) || 0),
    category: resolveAiCategory(draft.category, categories),
    note: draft.note || transcript,
    date: safeDate(draft.date, today),
    merchant: draft.merchant || undefined,
    source: 'voice',
  }
}
