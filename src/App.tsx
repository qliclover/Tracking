import { useEffect, useMemo, useState } from 'react'
import { AppState, Expense, Settings } from './lib/types'
import { loadState, saveState, makeExpense } from './lib/storage'
import { expensesForMonth, monthKey, summarize } from './lib/budget'
import { monthLabel } from './lib/format'
import { Theme, getTheme, applyTheme, nextTheme } from './lib/theme'
import { BudgetCard } from './components/BudgetCard'
import { AddExpense } from './components/AddExpense'
import { ExpenseList } from './components/ExpenseList'
import { SettingsDialog } from './components/SettingsDialog'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [theme, setTheme] = useState<Theme>(() => getTheme())
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

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

  const themeShort = theme === 'system' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'

  return (
    <div className="app">
      <header className="topbar">
        <span className="month">{monthLabel(currentMonth)}</span>
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => nextTheme(t))}
          aria-label="Toggle theme"
          title="Toggle appearance"
        >
          {themeShort}
        </button>
      </header>

      <main className="content">
        <BudgetCard summary={summary} currency={state.settings.currency} />

        <div className="rule" />

        <AddExpense currency={state.settings.currency} onAdd={addExpense} />

        <div className="rule" />

        <ExpenseList
          expenses={monthExpenses}
          currency={state.settings.currency}
          onDelete={deleteExpense}
        />
      </main>

      <button
        className="btn btn-ghost"
        style={{ marginTop: 20 }}
        onClick={() => setSettingsOpen(true)}
      >
        Budget settings
      </button>

      <footer className="footer">Keep a beautiful record</footer>

      {settingsOpen && (
        <SettingsDialog
          settings={state.settings}
          theme={theme}
          onSave={saveSettings}
          onThemeChange={setTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
