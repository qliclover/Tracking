import { useEffect, useMemo, useState } from 'react'
import { AppState, Profile, Recurring, Settings } from './lib/types'
import { ExpenseDraft } from './lib/receipt'
import { loadState, saveState, makeExpense, emptyState, newId } from './lib/storage'
import { currentPeriod, expensesForPeriod, daysLeftInPeriod } from './lib/period'
import { pendingCharges, reservedForPeriod } from './lib/recurring'
import { summarize } from './lib/budget'
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

  const period = useMemo(
    () => currentPeriod(state.settings.resetDay),
    [state.settings.resetDay],
  )

  // Post any due fixed-bill charges into the ledger.
  useEffect(() => {
    setState((prev) => {
      const p = currentPeriod(prev.settings.resetDay)
      const { expenses, keys } = pendingCharges(prev, p)
      if (expenses.length === 0) return prev
      return {
        ...prev,
        expenses: [...prev.expenses, ...expenses],
        postedRecurring: [...prev.postedRecurring, ...keys],
        updatedAt: Date.now(),
      }
    })
  }, [state.recurring, state.settings.resetDay])

  const periodExpenses = useMemo(
    () => expensesForPeriod(state.expenses, period),
    [state.expenses, period],
  )
  const reserved = useMemo(() => reservedForPeriod(state, period), [state, period])
  const summary = useMemo(
    () => summarize(periodExpenses, state.settings, { daysLeft: daysLeftInPeriod(period), reserved }),
    [periodExpenses, state.settings, period, reserved],
  )

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

  function addRecurring(input: Omit<Recurring, 'id' | 'createdAt'>) {
    const rec: Recurring = { ...input, id: newId(), createdAt: Date.now() }
    update((s) => ({ ...s, recurring: [...s.recurring, rec] }))
  }

  function updateRecurring(id: string, patch: Partial<Recurring>) {
    update((s) => ({
      ...s,
      recurring: s.recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  function deleteRecurring(id: string) {
    update((s) => ({ ...s, recurring: s.recurring.filter((r) => r.id !== id) }))
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `margin-backup-${period.key}.json`
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
          recurring: Array.isArray(parsed.recurring) ? parsed.recurring : s.recurring,
          postedRecurring: Array.isArray(parsed.postedRecurring)
            ? parsed.postedRecurring
            : s.postedRecurring,
        }))
      } catch {
        alert('That file could not be read as a Margin backup.')
      }
    }
    reader.readAsText(file)
  }

  function clearAll() {
    if (confirm('Delete everything and reset settings? This cannot be undone.')) {
      update(() => emptyState())
    }
  }

  if (view === 'settings') {
    return (
      <div className="app">
        <SettingsPage
          settings={state.settings}
          profile={state.profile}
          recurring={state.recurring}
          theme={theme}
          sync={sync}
          onSettings={saveSettings}
          onProfile={saveProfile}
          onAddRecurring={addRecurring}
          onUpdateRecurring={updateRecurring}
          onDeleteRecurring={deleteRecurring}
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
          <span className="month">{period.label}</span>
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
          expenses={periodExpenses}
          currency={state.settings.currency}
          onDelete={deleteExpense}
        />
      </main>

      <footer className="footer">Room to spend</footer>
    </div>
  )
}
