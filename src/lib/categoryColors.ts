// Earthy, muted category dot palette — matched to the Nook "ledger" look.
const PALETTE = ['#a5735a', '#6f7a4e', '#5e6b73', '#7a5c66', '#8a6d3c', '#4f6b62']

const NEUTRAL = '#8f8b82'

/** Stable color for a category name (same name → same dot every time). */
export function categoryColor(category: string, order: readonly string[]): string {
  if (!category) return NEUTRAL
  const idx = order.indexOf(category)
  if (idx >= 0) return PALETTE[idx % PALETTE.length]
  // Fallback: hash the string so unknown categories still get a stable color.
  let h = 0
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function colorForIndex(i: number): string {
  return PALETTE[i % PALETTE.length]
}
