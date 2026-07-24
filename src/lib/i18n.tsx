import { createContext, ReactNode, useContext } from 'react'

export type Lang = 'zh' | 'en'

type Entry = { zh: string; en: string }

const DICT: Record<string, Entry> = {
  // Hero / budget card
  left_to_spend: { zh: '本月可花', en: 'Left to spend' },
  over_budget: { zh: '已超支', en: 'Over budget' },
  budget: { zh: '额度', en: 'Budget' },
  spent: { zh: '已花', en: 'Spent' },
  pct_used: { zh: '已用 {v}%', en: '{v}% used' },
  pct_over: { zh: '超 {v}%', en: '{v}% over' },
  days_left: { zh: '还剩 {v} 天', en: '{v} days left' },
  bills_reserved: { zh: '待扣固定账单 · 预留 {v}', en: 'Fixed bills due later · {v} reserved' },
  set_budget_first: { zh: '先设置每月额度即可开始。', en: 'Set a monthly budget to begin.' },
  rem_over: { zh: '这个月超了 {v}。', en: "You're {v} past the line this month." },
  rem_warn: { zh: '只剩 {v} 了 —— 每天约 {p} 才够撑到月底。', en: 'Only {v} left — about {p} a day to finish the month.' },
  rem_ok: { zh: '每天约 {p} 就能稳住这个月。', en: 'About {p} a day keeps you on track.' },

  // Entry modes
  mode_type: { zh: '手动', en: 'Type' },
  mode_scan: { zh: '拍照', en: 'Scan' },
  mode_speak: { zh: '语音', en: 'Speak' },

  // Expense form
  new_entry: { zh: '记一笔', en: 'New entry' },
  amount: { zh: '金额', en: 'Amount' },
  note: { zh: '备注', en: 'Note' },
  optional: { zh: '可选', en: 'optional' },
  date: { zh: '日期', en: 'Date' },
  record_it: { zh: '记下', en: 'Record it' },
  save_expense: { zh: '保存', en: 'Save expense' },
  discard: { zh: '放弃', en: 'Discard' },
  err_amount: { zh: '请输入大于 0 的金额。', en: 'Enter an amount greater than 0.' },

  // Categories
  cat_Food: { zh: '餐饮', en: 'Food' },
  cat_Transport: { zh: '交通', en: 'Transport' },
  cat_Shopping: { zh: '购物', en: 'Shopping' },
  cat_Bills: { zh: '账单', en: 'Bills' },
  cat_Fun: { zh: '娱乐', en: 'Fun' },
  cat_Other: { zh: '其他', en: 'Other' },

  // Scan
  snap_receipt: { zh: '拍张小票', en: 'Snap a receipt' },
  snap_hint: { zh: '拍照或选一张图片', en: 'Take a photo or choose an image' },
  tap_retake: { zh: '点击重拍', en: 'Tap to retake' },
  read_receipt: { zh: '识别小票', en: 'Read receipt' },
  reading: { zh: '识别中…', en: 'Reading…' },
  scan_failed: { zh: '识别失败。', en: 'Scan failed.' },

  // Voice
  from_receipt: { zh: '来自小票 · 核对后保存', en: 'From receipt · check & save' },
  from_voice: { zh: '来自语音 · 核对后保存', en: 'From voice · check & save' },
  more_items: { zh: '还有 {v} 项', en: '+{v} more' },
  tap_speak: { zh: '点一下,说出你花了多少', en: 'Tap and say what you spent' },
  listening: { zh: '聆听中… 点击停止', en: 'Listening… tap to stop' },
  voice_hint: { zh: '例如:“午饭花了 25 块”', en: 'e.g. “12.40 on lunch today”' },
  type_instead: { zh: '改用打字', en: 'Type instead' },
  describe_expense: { zh: '描述这笔花销', en: 'Describe the expense' },
  describe_ph: { zh: '例如:午饭花了 25 块', en: 'e.g. 12.40 on lunch today' },
  analyze: { zh: '解析', en: 'Analyze' },
  analyzing: { zh: '解析中…', en: 'Analyzing…' },
  analyze_failed: { zh: '无法解析,请重试。', en: 'Could not analyze.' },

  // Expense list
  empty_title: { zh: '干净的一页。', en: 'A clean page.' },
  empty_sub: { zh: '在上面记下第一笔。', en: 'Record your first expense above.' },
  today: { zh: '今天', en: 'Today' },

  // Settings
  settings: { zh: '设置', en: 'Settings' },
  done: { zh: '完成', en: 'Done' },
  your_name: { zh: '你的名字', en: 'Your name' },
  add_photo: { zh: '添加头像', en: 'Add photo' },
  change_photo: { zh: '更换头像', en: 'Change photo' },
  remove: { zh: '移除', en: 'Remove' },
  monthly_budget: { zh: '每月额度', en: 'Monthly budget' },
  currency: { zh: '货币', en: 'Currency' },
  warn_at: { zh: '剩多少 % 时提醒', en: 'Warn at % left' },
  reset_on_day: { zh: '每月重置日', en: 'Cycle resets on day' },
  reset_hint: { zh: '设成发薪日(如 15),每月就按 15 号 → 次月 14 号计算。', en: 'Set this to your payday (e.g. 15) and each month runs 15th → 14th.' },
  appearance: { zh: '外观', en: 'Appearance' },
  theme_system: { zh: '跟随系统', en: 'System' },
  theme_light: { zh: '浅色', en: 'Light' },
  theme_dark: { zh: '深色', en: 'Dark' },
  language: { zh: '语言', en: 'Language' },
  sync: { zh: '同步', en: 'Sync' },
  sync_off: { zh: '仅本地', en: 'Local only' },
  sync_connecting: { zh: '连接中…', en: 'Connecting…' },
  sync_syncing: { zh: '同步中…', en: 'Syncing…' },
  sync_synced: { zh: '已同步', en: 'Synced' },
  sync_error: { zh: '同步出错', en: 'Sync error' },
  sync_desc_on: { zh: '通过 LeanCloud 在多设备间同步。', en: 'Synced across your devices via LeanCloud.' },
  sync_desc_off: { zh: '填入 LeanCloud 密钥即可多设备同步。', en: 'Add LeanCloud keys to sync across devices.' },
  sync_now: { zh: '立即同步', en: 'Sync now' },
  data: { zh: '数据', en: 'Data' },
  export_backup: { zh: '导出备份', en: 'Export backup' },
  import: { zh: '导入', en: 'Import' },
  clear_all: { zh: '清空所有数据', en: 'Clear all data' },
  confirm_clear: { zh: '删除全部并重置设置?此操作不可撤销。', en: 'Delete everything and reset settings? This cannot be undone.' },
  import_bad: { zh: '该文件无法作为有余备份读取。', en: 'That file could not be read as a Margin backup.' },

  // Recurring bills
  fixed_bills: { zh: '固定账单', en: 'Fixed bills' },
  fixed_empty: { zh: '房租、订阅…加进来会在每个周期自动扣。', en: "Rent, subscriptions… added here they're deducted automatically each cycle." },
  day_of: { zh: '每月 {d} 号 · {c}', en: 'Day {d} · {c}' },
  pause: { zh: '暂停', en: 'Pause' },
  resume: { zh: '恢复', en: 'Resume' },
  add_fixed: { zh: '+ 添加固定账单', en: '+ Add a fixed bill' },
  bill_name: { zh: '名称', en: 'Name' },
  bill_name_ph: { zh: '如:房租、Netflix', en: 'e.g. Rent, Netflix' },
  charged_day: { zh: '每月扣费日', en: 'Charged on day' },
  add_bill: { zh: '添加', en: 'Add bill' },
  cancel: { zh: '取消', en: 'Cancel' },
  err_bill_name: { zh: '给账单起个名字。', en: 'Give the bill a name.' },
  err_day: { zh: '日期需为 1–31。', en: 'Day must be 1–31.' },

  // Footer / brand
  tagline: { zh: '给自己留点余地', en: 'Room to spend' },
}

const CAT_KEY: Record<string, string> = {
  Food: 'cat_Food', Transport: 'cat_Transport', Shopping: 'cat_Shopping',
  Bills: 'cat_Bills', Fun: 'cat_Fun', Other: 'cat_Other',
}

export function translate(key: string, lang: Lang, params?: Record<string, string | number>): string {
  let s = DICT[key]?.[lang] ?? key
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v))
  return s
}

/** Localized display label for a category key (stored value stays English). */
export function categoryLabel(cat: string, lang: Lang): string {
  const k = CAT_KEY[cat]
  return k ? translate(k, lang) : cat
}

const LangContext = createContext<Lang>('zh')

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>
}

export function useLang(): Lang {
  return useContext(LangContext)
}

export type TFn = (key: string, params?: Record<string, string | number>) => string

export function useT(): TFn {
  const lang = useLang()
  return (key, params) => translate(key, lang, params)
}
