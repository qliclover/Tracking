import { useEffect, useMemo, useState } from 'react'
import { AppState, Expense, Settings } from './lib/types'
import { loadState, saveState, makeExpense } from './lib/storage'
import { expensesForMonth, monthKey, summarize } from './lib/budget'
import { monthLabel } from './lib/format'
import { BudgetCard } from './components/BudgetCard'
import { AddExpense } from './components/AddExpense'
import { ExpenseList } from './components/ExpenseList'
import { SettingsDialog } from './components/SettingsDialog'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Persist on every change.
  useEffect(() => {
    saveState(state)
  }, [state])

  const currentMonth = monthKey()

  const monthExpenses = useMemo(
    () => expensesForMonth(state.expenses, currentMonth),
    [state.expenses, currentMonth],
  )

  const summary = useMemo(
    () => summarize(monthExpenses, state.settings),
    [monthExpenses, state.settings],
  )

  function addExpense(input: Omit<Expense, 'id' | 'createdAt'>) {
    setState((s) => ({ ...s, expenses: [...s.expenses, makeExpense(input)] }))
  }

  function deleteExpense(id: string) {
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }))
  }

  function saveSettings(next: Settings) {
    setState((s) => ({ ...s, settings: next }))
    setSettingsOpen(false)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1 className="brand">Tracking</h1>
          <p className="subtitle">{monthLabel(currentMonth)}</p>
        </div>
        <button
          className="btn-icon settings-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          title="Budget settings"
        >
          ⚙
        </button>
      </header>

      <main className="content">
        <BudgetCard summary={summary} currency={state.settings.currency} />
        <AddExpense currency={state.settings.currency} onAdd={addExpense} />
        <ExpenseList
          expenses={monthExpenses}
          currency={state.settings.currency}
          onDelete={deleteExpense}
        />
      </main>

      <footer className="footer">
        <span>One budget. Every account. No fuss.</span>
      </footer>

      {settingsOpen && (
        <SettingsDialog
          settings={state.settings}
          onSave={saveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
