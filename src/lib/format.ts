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
