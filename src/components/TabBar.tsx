import { useT } from '../lib/i18n'

export type MainTab = 'ledger' | 'stats' | 'bills' | 'settings'

interface Props {
  tab: MainTab
  onTab: (tab: MainTab) => void
  onAdd: () => void
}

const ITEMS: { key: MainTab; tk: string }[] = [
  { key: 'ledger', tk: 'tab_ledger' },
  { key: 'stats', tk: 'tab_stats' },
]
const ITEMS_RIGHT: { key: MainTab; tk: string }[] = [
  { key: 'bills', tk: 'tab_bills' },
  { key: 'settings', tk: 'settings' },
]

export function TabBar({ tab, onTab, onAdd }: Props) {
  const t = useT()

  function Item({ item }: { item: { key: MainTab; tk: string } }) {
    const active = tab === item.key
    return (
      <button type="button" className="tabbar-item" onClick={() => onTab(item.key)}>
        <span className={`tabbar-dash ${active ? 'active' : ''}`} />
        <span className={active ? 'tabbar-label active' : 'tabbar-label'}>{t(item.tk)}</span>
      </button>
    )
  }

  return (
    <nav className="tabbar">
      {ITEMS.map((item) => (
        <Item key={item.key} item={item} />
      ))}
      <button type="button" className="tabbar-fab" aria-label={t('new_entry')} onClick={onAdd}>
        <span className="tabbar-fab-plus" />
      </button>
      {ITEMS_RIGHT.map((item) => (
        <Item key={item.key} item={item} />
      ))}
    </nav>
  )
}
