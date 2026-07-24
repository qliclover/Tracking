import { ExpenseDraft, Receipt, receiptSummary } from './receipt'
import { todayISO } from './format'

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

function fallbackCategory(c: string | null | undefined): string {
  return c && c.trim() ? c : 'Other'
}

/** Send a receipt image (data URL) and normalize the result into a draft. */
export async function scanReceipt(imageDataUrl: string): Promise<ExpenseDraft> {
  const { receipt } = await postJSON<{ receipt: Receipt }>('/api/receipt', {
    image: imageDataUrl,
  })
  return {
    amount: Math.abs(Number(receipt.total) || 0),
    category: fallbackCategory(receipt.category),
    note: receiptSummary(receipt),
    date: receipt.date || todayISO(),
    merchant: receipt.merchant || undefined,
    items: receipt.items?.length ? receipt.items : undefined,
    source: 'scan',
  }
}

interface VoiceDraft {
  amount: number
  category: string
  note: string
  date: string
  merchant: string | null
}

/** Send a spoken transcript and normalize the result into a draft. */
export async function analyzeVoice(transcript: string): Promise<ExpenseDraft> {
  const { draft } = await postJSON<{ draft: VoiceDraft }>('/api/voice', { transcript })
  return {
    amount: Math.abs(Number(draft.amount) || 0),
    category: fallbackCategory(draft.category),
    note: draft.note || transcript,
    date: draft.date || todayISO(),
    merchant: draft.merchant || undefined,
    source: 'voice',
  }
}
