/** The fixed set of quick categories, shared across entry, list, and AI. */
export const QUICK_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Fun', 'Other'] as const

export type QuickCategory = (typeof QUICK_CATEGORIES)[number]
