import { useEffect, useMemo, useState } from 'react'
import { AppState, Profile, Recurring, Settings } from './lib/types'
import { ExpenseDraft } from './lib/receipt'
import { loadState, saveState, makeExpense, emptyState, newId } from './lib/storage'
import { currentPeriod, expensesForPeriod, daysLeftInPeriod, periodMonthName } from './lib/period'
import { LangProvider, translate } from './lib/i18n'
import { pendingCharges, reservedForPeriod } from './lib/recurring'
import { summarize } from './lib/budget'
import { nextColor } from './lib/categoryColors'
import { resolveAiCategory } from './lib/categories'
import { Theme, getTheme, applyTheme } from './lib/theme'
import { useSync } from './lib/useSync'
import { syncWidget } from './lib/widget'
import { BudgetCard } from './components/BudgetCard'
import { EntryMode } from './components/EntrySection'
import { EntrySheet } from './components/EntrySheet'
import { ExpenseList } from './components/ExpenseList'
import { Insights } from './components/Insights'
import { BillsPage } from './components/BillsPage'
import { AddBillSheet } from './components/AddBillSheet'
import { TabBar, MainTab } from './components/TabBar'
import { SettingsPage } from './components/SettingsPage'
import { CategoriesPage } from './components/CategoriesPage'
import { ProfilePage } from './components/ProfilePage'
import { SyncSettingsPage } from './components/SyncSettingsPage'

type SubView = 'none' | 'profile' | 'categories' | 'sync'
type SheetView = 'none' | 'entry' | 'addBill'

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [theme, setTheme] = useState<Theme>(() => getTheme())
  const [tab, setTab] = useState<MainTab>('ledger')
  const [subView, setSubView] = useState<SubView>('none')
  const [sheet, setSheet] = useState<SheetView>('none')
  const [entryMode, setEntryMode] = useState<EntryMode>('type')
  const [prefill, setPrefill] = useState<{ category: string; nonce: number } | null>(null)
  const [viewAnchor, setViewAnchor] = useState<Date>(() => new Date())
  const [ledgerExpanded, setLedgerExpanded] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Deep links from the quick-add widgets: margin://add?mode=type|scan|speak&category=Food
  useEffect(() => {
    let cleanup: (() => void) | undefined
    import('@capacitor/app').then(({ App: CapApp }) => {
      const handle = CapApp.addListener('appUrlOpen', ({ url }) => {
        try {
          const parsed = new URL(url)
          const mode = parsed.searchParams.get('mode')
          if (mode === 'type' || mode === 'scan' || mode === 'speak') {
            setTab('ledger')
            setSubView('none')
            setSheet('entry')
            setEntryMode(mode)
            const category = parsed.searchParams.get('category')
            setPrefill(
              category
                ? { category: resolveAiCategory(category, state.categories), nonce: Date.now() }
                : null,
            )
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
  }, [state.categories])

  const sync = useSync({ state, onRemote: (remote) => setState(remote) })

  // Browsed period (month pager on Home) — separate from the real current period below.
  const period = useMemo(
    () => currentPeriod(state.settings.resetDay, viewAnchor),
    [state.settings.resetDay, viewAnchor],
  )

  function goPrevPeriod() {
    setViewAnchor(new Date(period.start.getTime() - 1))
  }
  function goNextPeriod() {
    setViewAnchor(new Date(period.end.getTime()))
  }

  // Post any due fixed-bill charges into the ledger — always the REAL current
  // period, regardless of what month the user is browsing on Home.
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

  // Widget sync always reflects the REAL current period, not the browsed one.
  const realPeriod = useMemo(
    () => currentPeriod(state.settings.resetDay),
    [state.settings.resetDay],
  )
  const realPeriodExpenses = useMemo(
    () => expensesForPeriod(state.expenses, realPeriod),
    [state.expenses, realPeriod],
  )
  const realReserved = useMemo(() => reservedForPeriod(state, realPeriod), [state, realPeriod])
  const realSummary = useMemo(
    () => summarize(realPeriodExpenses, state.settings, { daysLeft: daysLeftInPeriod(realPeriod), reserved: realReserved }),
    [realPeriodExpenses, state.settings, realPeriod, realReserved],
  )

  useEffect(() => {
    const label = `${realPeriod.start.getFullYear()}年 ${periodMonthName(realPeriod, state.settings.lang)}`
    const monthName = periodMonthName(realPeriod, state.settings.lang)
    syncWidget(realSummary, state.settings.currency, label, monthName, state.settings.lang, realPeriodExpenses, state.categories)
  }, [realSummary, state.settings.currency, state.settings.lang, realPeriod, realPeriodExpenses, state.categories])

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

  function closeEntrySheet() {
    setSheet('none')
    setPrefill(null)
  }

  // ---- Pushed sub-views (Profile / Categories / Sync settings) ----
  if (subView === 'profile') {
    return (
      <LangProvider lang={lang}>
      <div className="app">
        <ProfilePage profile={state.profile} onProfile={saveProfile} onBack={() => setSubView('none')} />
      </div>
      </LangProvider>
    )
  }
  if (subView === 'categories') {
    return (
      <LangProvider lang={lang}>
      <div className="app">
        <CategoriesPage
          categories={state.categories}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
          onBack={() => setSubView('none')}
        />
      </div>
      </LangProvider>
    )
  }
  if (subView === 'sync') {
    return (
      <LangProvider lang={lang}>
      <div className="app">
        <SyncSettingsPage sync={sync} onBack={() => setSubView('none')} />
      </div>
      </LangProvider>
    )
  }

  const year = period.start.getFullYear()
  const monthName = periodMonthName(period, lang)
  const totalDays = Math.round((period.end.getTime() - period.start.getTime()) / 86400000)
  const daysElapsed = Math.max(1, totalDays - daysLeftInPeriod(period) + 1)

  return (
    <LangProvider lang={lang}>
    <div className={`app app-v2${tab === 'settings' ? ' app-settings' : ''}`}>
      <main className="content">
        {tab === 'ledger' && !ledgerExpanded && (
          <>
            <BudgetCard
              summary={summary}
              currency={state.settings.currency}
              year={year}
              monthName={monthName}
              onPrev={goPrevPeriod}
              onNext={goNextPeriod}
            />
            <div className="rule" />
            <ExpenseList
              expenses={periodExpenses}
              categories={state.categories}
              currency={state.settings.currency}
              onDelete={deleteExpense}
              limit={2}
              onSeeAll={() => setLedgerExpanded(true)}
            />
          </>
        )}

        {tab === 'ledger' && ledgerExpanded && (
          <>
            <div className="page-head">
              <div>
                <div className="wordmark serif cjk page-title">{t('tab_ledger')}</div>
                <div className="page-sub">{monthName} · {periodExpenses.length}</div>
              </div>
              <button type="button" className="theme-toggle" onClick={() => setLedgerExpanded(false)}>
                {t('done')}
              </button>
            </div>
            <ExpenseList
              expenses={periodExpenses}
              categories={state.categories}
              currency={state.settings.currency}
              onDelete={deleteExpense}
              showFullDate
            />
          </>
        )}

        {tab === 'stats' && (
          <>
            <div className="page-head">
              <div>
                <div className="wordmark serif cjk page-title">{t('tab_stats')}</div>
                <div className="page-sub">{lang === 'zh' ? `${year}年 ${monthName}` : `${monthName} ${year}`}</div>
              </div>
            </div>
            <Insights
              expenses={periodExpenses}
              categories={state.categories}
              period={period}
              currency={state.settings.currency}
              daysElapsed={daysElapsed}
              summary={summary}
            />
          </>
        )}

        {tab === 'bills' && (
          <BillsPage
            currency={state.settings.currency}
            categories={state.categories}
            recurring={state.recurring}
            postedRecurring={state.postedRecurring}
            period={realPeriod}
            reserved={realReserved}
            onUpdate={updateRecurring}
            onDelete={deleteRecurring}
            onAddOpen={() => setSheet('addBill')}
          />
        )}

        {tab === 'settings' && (
          <SettingsPage
            settings={state.settings}
            profile={state.profile}
            categories={state.categories}
            theme={theme}
            sync={sync}
            onSettings={saveSettings}
            onTheme={setTheme}
            onExport={exportBackup}
            onImport={importBackup}
            onClear={clearAll}
            onOpenProfile={() => setSubView('profile')}
            onOpenCategories={() => setSubView('categories')}
            onOpenSync={() => setSubView('sync')}
          />
        )}
      </main>

      <TabBar
        tab={tab}
        onTab={(next) => {
          setTab(next)
          setLedgerExpanded(false)
        }}
        onAdd={() => setSheet('entry')}
      />

      <EntrySheet
        open={sheet === 'entry'}
        onClose={closeEntrySheet}
        currency={state.settings.currency}
        categories={state.categories}
        mode={entryMode}
        onModeChange={setEntryMode}
        onAdd={(draft) => {
          addExpense(draft)
          closeEntrySheet()
        }}
        prefillCategory={prefill?.category}
        prefillKey={prefill?.nonce}
      />

      <AddBillSheet
        open={sheet === 'addBill'}
        categories={state.categories}
        onAdd={addRecurring}
        onClose={() => setSheet('none')}
      />
    </div>
    </LangProvider>
  )
}
