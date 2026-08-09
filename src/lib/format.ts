export function money(amount: number, currency: string): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}${currency}${group(Math.abs(amount))}`
}

/** Signed money for ledger rows, e.g. "-$12.40" / "+$4,200.00". */
export function signedMoney(amount: number, currency: string): string {
  const sign = amount < 0 ? '−' : '+' // real minus sign U+2212
  return `${sign}${currency}${group(Math.abs(amount))}`
}

/** Thousands-separated, two decimals. */
export function group(n: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Split a number into its grouped integer part and 2-digit decimal part. */
export function splitMoney(amount: number): { int: string; dec: string } {
  const abs = Math.abs(amount)
  const whole = Math.floor(abs)
  const cents = Math.round((abs - whole) * 100)
  return {
    int: whole.toLocaleString('en-US'),
    dec: String(cents).padStart(2, '0'),
  }
}

export function todayISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** True only for a real calendar date written as YYYY-MM-DD. */
export function isValidISODate(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [y, m, d] = v.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

/**
 * Keep an AI-returned date only if it's plausible, else fall back to today.
 * The models sometimes answer with prose ("昨天"), another format ("08/07/2026"),
 * or a misread receipt year — anything that isn't a real recent date would
 * otherwise land in the ledger and break day grouping and month totals.
 */
export function safeDate(value: unknown, today: string = todayISO()): string {
  if (!isValidISODate(value)) return today
  const days = daysBetween(value, today)
  // One day of slack ahead for a device clock that's slightly off; nothing
  // older than five years, which means the year was misread.
  if (days < -1 || days > 365 * 5) return today
  return value
}

/** Whole days from `iso` to `to` — positive when `iso` is in the past. */
function daysBetween(iso: string, to: string): number {
  const [y1, m1, d1] = iso.split('-').map(Number)
  const [y2, m2, d2] = to.split('-').map(Number)
  return Math.round(
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000,
  )
}

export function prettyDate(iso: string, lang: 'zh' | 'en' = 'en'): string {
  const [y, m, day] = iso.split('-').map(Number)
  if (!y || !m || !day) return iso
  const today = new Date()
  const isToday =
    y === today.getFullYear() && m === today.getMonth() + 1 && day === today.getDate()
  if (isToday) return lang === 'zh' ? '今天' : 'Today'
  if (lang === 'zh') return `${m}月${day}日`
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${months[m - 1]} ${day}`
}

/** Day-group header label: "Today" / "Yesterday" / "M月D日" (or "Jan D" in English). */
export function dayGroupLabel(iso: string, lang: 'zh' | 'en' = 'en'): string {
  const [y, m, day] = iso.split('-').map(Number)
  if (!y || !m || !day) return iso
  const d = new Date(y, m - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return lang === 'zh' ? '今天' : 'Today'
  if (diffDays === 1) return lang === 'zh' ? '昨天' : 'Yesterday'
  if (lang === 'zh') return `${m}月${day}日`
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${months[m - 1]} ${day}`
}

/** Uppercase month label for the header, e.g. "JULY 2026". */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
  ]
  return `${months[m - 1]} ${y}`
}
