import { useEffect, useMemo, useState } from 'react'
import { AppState, Profile, Recurring, Settings } from './lib/types'
import { ExpenseDraft } from './lib/receipt'
import { loadState, saveState, makeExpense, emptyState, newId } from './lib/storage'
import { currentPeriod, expensesForPeriod, daysLeftInPeriod, periodLabel, periodMonthName } from './lib/period'
import { LangProvider, translate } from './lib/i18n'
import { pendingCharges, reservedForPeriod } from './lib/recurring'
import { summarize } from './lib/budget'
import { nextColor } from './lib/categoryColors'
import { Theme, getTheme, applyTheme } from './lib/theme'
import { useSync } from './lib/useSync'
import { syncWidget } from './lib/widget'
import { BudgetCard } from './components/BudgetCard'
import { EntrySection, EntryMode } from './components/EntrySection'
import { ExpenseList } from './components/ExpenseList'
import { Insights } from './components/Insights'
import { SettingsPage } from './components/SettingsPage'
import { CategoriesPage } from './components/CategoriesPage'

type View = 'home' | 'settings' | 'categories'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [theme, setTheme] = useState<Theme>(() => getTheme())
  const [view, setView] = useState<View>('home')
  const [tab, setTab] = useState<'ledger' | 'stats'>('ledger')
  const [entryMode, setEntryMode] = useState<EntryMode>('type')

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Deep links from the "记一笔" quick-add widget: margin://add?mode=type|scan|speak
  useEffect(() => {
    let cleanup: (() => void) | undefined
    import('@capacitor/app').then(({ App: CapApp }) => {
      const handle = CapApp.addListener('appUrlOpen', ({ url }) => {
        try {
          const parsed = new URL(url)
          const mode = parsed.searchParams.get('mode')
          if (mode === 'type' || mode === 'scan' || mode === 'speak') {
            setView('home')
            setTab('ledger')
            setEntryMode(mode)
          }
        } catch {
          /* ignore malformed URLs */
        }
      })
      cleanup = () => {
        handle.then((h) => h.remove())
      }
    })
    return () => cleanup?.()
  }, [])

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

  useEffect(() => {
    const label = periodLabel(period, state.settings.resetDay, state.settings.lang)
    const monthName = periodMonthName(period, state.settings.lang)
    syncWidget(summary, state.settings.currency, label, monthName, state.settings.lang, periodExpenses, state.categories)
  }, [summary, state.settings.currency, state.settings.resetDay, state.settings.lang, period, periodExpenses, state.categories])

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

  function addCategory(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    update((s) => {
      if (s.categories.some((c) => c.name === trimmed)) return s
      return { ...s, categories: [...s.categories, { name: trimmed, color: nextColor(s.categories) }] }
    })
  }

  function renameCategory(oldName: string, newName: string) {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName) return
    update((s) => ({
      ...s,
      categories: s.categories.map((c) => (c.name === oldName ? { ...c, name: trimmed } : c)),
      expenses: s.expenses.map((e) => (e.category === oldName ? { ...e, category: trimmed } : e)),
      recurring: s.recurring.map((r) => (r.category === oldName ? { ...r, category: trimmed } : r)),
    }))
  }

  function deleteCategory(name: string) {
    update((s) => {
      if (s.categories.length <= 1) return s
      return { ...s, categories: s.categories.filter((c) => c.name !== name) }
    })
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
          categories:
            Array.isArray(parsed.categories) && parsed.categories.length > 0
              ? parsed.categories
              : s.categories,
          recurring: Array.isArray(parsed.recurring) ? parsed.recurring : s.recurring,
          postedRecurring: Array.isArray(parsed.postedRecurring)
            ? parsed.postedRecurring
            : s.postedRecurring,
        }))
      } catch {
        alert(translate('import_bad', state.settings.lang))
      }
    }
    reader.readAsText(file)
  }

  const lang = state.settings.lang
  const t = (k: string, p?: Record<string, string | number>) => translate(k, lang, p)

  function clearAll() {
    if (confirm(t('confirm_clear'))) {
      update(() => emptyState())
    }
  }

  if (view === 'categories') {
    return (
      <LangProvider lang={lang}>
      <div className="app">
        <CategoriesPage
          categories={state.categories}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
          onBack={() => setView('settings')}
        />
      </div>
      </LangProvider>
    )
  }

  if (view === 'settings') {
    return (
      <LangProvider lang={lang}>
      <div className="app">
        <SettingsPage
          settings={state.settings}
          profile={state.profile}
          categories={state.categories}
          recurring={state.recurring}
          theme={theme}
          sync={sync}
          onSettings={saveSettings}
          onProfile={saveProfile}
          onOpenCategories={() => setView('categories')}
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
      </LangProvider>
    )
  }

  const initial = (state.profile.name?.trim()?.[0] || (lang === 'zh' ? '余' : 'M')).toUpperCase()
  const totalDays = Math.round((period.end.getTime() - period.start.getTime()) / 86400000)
  const daysElapsed = Math.max(1, totalDays - daysLeftInPeriod(period) + 1)

  return (
    <LangProvider lang={lang}>
    <div className="app">
      <header className="topbar">
        <div className="brand-text">
          <div className={`wordmark ${lang === 'zh' ? 'cjk' : 'serif'}`}>{lang === 'zh' ? '有余' : 'Margin'}</div>
          <span className="month">{periodLabel(period, state.settings.resetDay, lang)}</span>
        </div>
        <button
          className="avatar avatar-btn"
          onClick={() => setView('settings')}
          aria-label={t('settings')}
        >
          {state.profile.avatar ? <img src={state.profile.avatar} alt="" /> : <span>{initial}</span>}
        </button>
      </header>

      <main className="content">
        <BudgetCard summary={summary} currency={state.settings.currency} />
        <div className="rule" />
        <EntrySection
          currency={state.settings.currency}
          categories={state.categories}
          mode={entryMode}
          onModeChange={setEntryMode}
          onAdd={addExpense}
        />
        <div className="rule" />

        <div className="tabs">
          <button
            className={`tab ${tab === 'ledger' ? 'active' : ''}`}
            onClick={() => setTab('ledger')}
          >
            {t('tab_ledger')}
          </button>
          <button
            className={`tab ${tab === 'stats' ? 'active' : ''}`}
            onClick={() => setTab('stats')}
          >
            {t('tab_stats')}
          </button>
        </div>

        {tab === 'ledger' ? (
          <ExpenseList
            expenses={periodExpenses}
            categories={state.categories}
            currency={state.settings.currency}
            onDelete={deleteExpense}
          />
        ) : (
          <Insights
            expenses={periodExpenses}
            categories={state.categories}
            period={period}
            currency={state.settings.currency}
            daysElapsed={daysElapsed}
          />
        )}
      </main>

      <footer className="footer">{t('tagline')}</footer>
    </div>
    </LangProvider>
  )
}
