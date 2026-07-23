export function money(amount: number, currency: string): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}${currency}${Math.abs(amount).toFixed(2)}`
}

export function todayISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function prettyDate(iso: string): string {
  // iso is YYYY-MM-DD; render as e.g. "Jul 23"
  const [y, m, day] = iso.split('-').map(Number)
  if (!y || !m || !day) return iso
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${months[m - 1]} ${day}`
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${months[m - 1]} ${y}`
}
