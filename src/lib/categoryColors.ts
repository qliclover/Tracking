import { Category } from './types'

// Earthy, muted category dot palette — matched to the Nook "ledger" look.
const PALETTE = ['#a5735a', '#6f7a4e', '#5e6b73', '#7a5c66', '#8a6d3c', '#4f6b62']

const NEUTRAL = '#8f8b82'

function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/** A category's stored color, falling back to a stable hash for orphaned/unknown names. */
export function categoryColor(name: string, categories: readonly Category[]): string {
  if (!name) return NEUTRAL
  const found = categories.find((c) => c.name === name)
  return found ? found.color : hashColor(name)
}

export function colorForIndex(i: number): string {
  return PALETTE[i % PALETTE.length]
}

/** Pick a color for a newly added category — round-robins the palette by how many are already in use. */
export function nextColor(categories: readonly Category[]): string {
  return PALETTE[categories.length % PALETTE.length]
}
