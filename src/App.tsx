import { useEffect, useMemo, useState } from 'react'
import { AppState, Profile, Settings } from './lib/types'
import { ExpenseDraft } from './lib/receipt'
import { loadState, saveState, makeExpense, emptyState } from './lib/storage'
import { expensesForMonth, monthKey, summarize } from './lib/budget'
import { monthLabel } from './lib/format'
import { Theme, getTheme, applyTheme } from './lib/theme'
import { useSync } from './lib/useSync'
import { BudgetCard } from './components/BudgetCard'
import { EntrySection } from './components/EntrySection'
import { ExpenseList } from './components/ExpenseList'
import { SettingsPage } from './components/SettingsPage'

type View = 'home' | 'settings'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [theme, setTheme] = useState<Theme>(() => getTheme())
  const [view, setView] = useState<View>('home')

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const sync = useSync({ state, onRemote: (remote) => setState(remote) })

  const currentMonth = monthKey()
  const monthExpenses = useMemo(
    () => expensesForMonth(state.expenses, currentMonth),
    [state.expenses, currentMonth],
  )
  const summary = useMemo(
    () => summarize(monthExpenses, state.settings),
    [monthExpenses, state.settings],
  )

  /** Apply a mutation and stamp updatedAt so sync knows it changed. */
  function update(mut: (s: AppState) => AppState) {
    setState((prev) => ({ ...mut(prev), updatedAt: Date.now() }))
  }

  function addExpense(draft: ExpenseDraft) {
    const expense = makeExpense({
      amount: draft.amount,
      category: draft.category,
      note: draft.note || undefined,
      date: draft.date,
      source: draft.source,
      merchant: draft.merchant,
      items: draft.items,
    })
    update((s) => ({ ...s, expenses: [...s.expenses, expense] }))
  }

  function deleteExpense(id: string) {
    update((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }))
  }

  function saveSettings(next: Settings) {
    update((s) => ({ ...s, settings: next }))
  }

  function saveProfile(next: Profile) {
    update((s) => ({ ...s, profile: next }))
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `margin-backup-${currentMonth}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importBackup(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<AppState>
        update((s) => ({
          ...s,
          settings: { ...s.settings, ...(parsed.settings ?? {}) },
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : s.expenses,
          profile: parsed.profile ?? s.profile,
        }))
      } catch {
        alert('That file could not be read as a Margin backup.')
      }
    }
    reader.readAsText(file)
  }

  function clearAll() {
    if (confirm('Delete all expenses and reset settings? This cannot be undone.')) {
      update(() => emptyState())
    }
  }

  if (view === 'settings') {
    return (
      <div className="app">
        <SettingsPage
          settings={state.settings}
          profile={state.profile}
          theme={theme}
          sync={sync}
          onSettings={saveSettings}
          onProfile={saveProfile}
          onTheme={setTheme}
          onExport={exportBackup}
          onImport={importBackup}
          onClear={clearAll}
          onBack={() => setView('home')}
        />
      </div>
    )
  }

  const initial = (state.profile.name?.trim()?.[0] || 'M').toUpperCase()

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="wordmark serif">Margin</div>
          <span className="month">{monthLabel(currentMonth)}</span>
        </div>
        <button
          className="avatar avatar-btn"
          onClick={() => setView('settings')}
          aria-label="Settings"
        >
          {state.profile.avatar ? <img src={state.profile.avatar} alt="" /> : <span>{initial}</span>}
        </button>
      </header>

      <main className="content">
        <BudgetCard summary={summary} currency={state.settings.currency} />
        <div className="rule" />
        <EntrySection currency={state.settings.currency} onAdd={addExpense} />
        <div className="rule" />
        <ExpenseList
          expenses={monthExpenses}
          currency={state.settings.currency}
          onDelete={deleteExpense}
        />
      </main>

      <footer className="footer">Room to spend</footer>
    </div>
  )
}
