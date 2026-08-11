import { useEffect } from 'react'

/** Calls onEscape when Escape is pressed, only while active — for closing modal sheets. */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onEscape()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, onEscape])
}
