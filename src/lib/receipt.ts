// Shared shapes for AI-extracted receipts and the editable draft that both
// the Scan and Voice flows funnel into before becoming an Expense.

export interface ReceiptItem {
  name: string
  price: number
}

/** Structured receipt as returned by /api/receipt (mirrors the AI schema). */
export interface Receipt {
  merchant: string
  date: string | null
  currency: string | null
  items: ReceiptItem[]
  subtotal: number | null
  discount: number | null
  tax: number | null
  shipping: number | null
  tips: number | null
  total: number
  category: string | null
}

/** The editable, ready-to-save draft shared by manual / scan / voice. */
export interface ExpenseDraft {
  amount: number
  category: string
  note: string
  date: string
  merchant?: string
  items?: ReceiptItem[]
  source: 'manual' | 'scan' | 'voice'
}

/**
 * Fold a receipt's extras into a single readable note, since an Expense note is
 * just a string. Mirrors Nook's receiptSummary so the two apps read alike.
 */
export function receiptSummary(r: Receipt): string {
  const parts: string[] = []
  if (r.items?.length) parts.push(r.items.map((i) => i.name).join(', '))

  const extras: string[] = []
  if (r.tax) extras.push(`tax ${r.tax.toFixed(2)}`)
  if (r.tips) extras.push(`tip ${r.tips.toFixed(2)}`)
  if (r.discount) extras.push(`−${r.discount.toFixed(2)} off`)
  if (r.shipping) extras.push(`shipping ${r.shipping.toFixed(2)}`)
  if (extras.length) parts.push(extras.join(', '))

  const detail = parts.join(' · ')
  return detail ? `${r.merchant} — ${detail}` : r.merchant
}
