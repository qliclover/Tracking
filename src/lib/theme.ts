export type Theme = 'system' | 'light' | 'dark'

const KEY = 'margin.theme'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const t = localStorage.getItem(KEY)
  return t === 'light' || t === 'dark' ? t : 'system'
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') {
    localStorage.removeItem(KEY)
    root.removeAttribute('data-theme')
  } else {
    localStorage.setItem(KEY, theme)
    root.setAttribute('data-theme', theme)
  }
}

/** Cycle order used by the header toggle. */
export function nextTheme(theme: Theme): Theme {
  return theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
}
