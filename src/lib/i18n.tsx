import { createContext, ReactNode, useContext } from 'react'

export type Lang = 'zh' | 'en'

type Entry = { zh: string; en: string }

const DICT: Record<string, Entry> = {
  // Hero / budget card
  left_to_spend: { zh: '本月可花', en: 'Left to spend' },
  over_budget: { zh: '已超支', en: 'Over budget' },
  budget: { zh: '额度', en: 'Budget' },
  spent: { zh: '已花', en: 'Spent' },
  set_budget_first: { zh: '先设置每月额度即可开始。', en: 'Set a monthly budget to begin.' },
  rem_over: { zh: '这个月超了 {v},还剩 {d} 天。', en: "You're {v} past the line, {d} days left." },
  rem_warn: { zh: '只剩 {v} 了 —— 每天约 {p} 才够撑到月底,还剩 {d} 天。', en: 'Only {v} left — about {p} a day to finish the month, {d} days left.' },
  rem_ok: { zh: '每天约 {p} 就能稳住,还剩 {d} 天。', en: 'About {p} a day keeps you on track, {d} days left.' },

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
  edit_expense_title: { zh: '编辑账目', en: 'Edit expense' },
  delete_expense: { zh: '删除账目', en: 'Delete expense' },
  confirm_delete_expense: { zh: '删除这笔账目?此操作不可撤销。', en: 'Delete this expense? This cannot be undone.' },

  // Categories
  cat_Food: { zh: '餐饮', en: 'Food' },
  cat_Transport: { zh: '交通', en: 'Transport' },
  cat_Shopping: { zh: '购物', en: 'Shopping' },
  cat_Bills: { zh: '账单', en: 'Bills' },
  cat_Fun: { zh: '娱乐', en: 'Fun' },
  cat_Other: { zh: '其他', en: 'Other' },

  // Scan
  snap_receipt: { zh: '拍张小票', en: 'Snap a receipt' },
  snap_hint: { zh: '拍照或选图片,小票太长可以选多张', en: 'Take a photo or choose images — pick several for a long receipt' },
  tap_retake: { zh: '点击重拍', en: 'Tap to retake' },
  read_receipt: { zh: '识别小票', en: 'Read receipt' },
  reading: { zh: '识别中…', en: 'Reading…' },
  scan_failed: { zh: '识别失败。', en: 'Scan failed.' },
  scan_multi_hint: { zh: '这 {v} 张会当成同一张小票合并识别。', en: "These {v} photos will be read as one receipt." },
  scan_desc: {
    zh: '对准小票拍照,AI 会自动读出商家、单项、税费与合计,生成一张可编辑的草稿,一键确认即可入账。',
    en: 'Point your camera at a receipt and AI reads the merchant, line items, tax, and total — then drops it into an editable draft you confirm in one tap.',
  },
  scan_powered: { zh: 'Powered by Qwen-VL · 通义千问', en: 'Powered by Qwen-VL · 通义千问' },

  // Voice
  from_receipt: { zh: '来自小票 · 核对后保存', en: 'From receipt · check & save' },
  from_voice: { zh: '来自语音 · 核对后保存', en: 'From voice · check & save' },
  more_items: { zh: '还有 {v} 项', en: '+{v} more' },
  tap_speak: { zh: '点一下,说出你花了多少', en: 'Tap and say what you spent' },
  listening: { zh: '录音中… 点击停止', en: 'Recording… tap to stop' },
  transcribing: { zh: '转写中…', en: 'Transcribing…' },
  voice_hint: { zh: '例如:“午饭花了 25 块”', en: 'e.g. “12.40 on lunch today”' },
  type_instead: { zh: '改用打字', en: 'Type instead' },
  describe_expense: { zh: '描述这笔花销', en: 'Describe the expense' },
  describe_ph: { zh: '例如:午饭花了 25 块', en: 'e.g. 12.40 on lunch today' },
  analyze: { zh: '解析', en: 'Analyze' },
  analyzing: { zh: '解析中…', en: 'Analyzing…' },
  analyze_failed: { zh: '无法解析,请重试。', en: 'Could not analyze.' },
  voice_desc: {
    zh: '说一句”午饭花了 25 块”,通义千问会把它转成文字再解析成一条结构化记录 —— 任意语言都行。录音权限不可用时会自动切到打字。',
    en: 'Say “12.40 on lunch today” and Qwen transcribes it, then parses it into a structured entry — any language works. Falls back to typing automatically when the mic is unavailable.',
  },
  mic_unavailable: { zh: 'Mic unavailable · 已切到打字', en: 'Mic unavailable · switched to typing' },

  // Expense list
  today: { zh: '今天', en: 'Today' },
  yesterday: { zh: '昨天', en: 'Yesterday' },
  clean_page: { zh: '干净的一页。', en: 'A clean page.' },
  empty_cta: {
    zh: '点下面的圆钮记下第一笔。\n手动、拍照、语音都行。',
    en: 'Tap the button below to record your first one.\nType, scan, or speak — whatever works.',
  },
  all_this_month: { zh: '本月全部 {v} 笔', en: 'All {v} this month' },
  reserved: { zh: '已预留', en: 'Reserved' },

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
  sync_conflict: { zh: '需要选择保留哪份', en: 'Choose which version to keep' },
  sync_conflict_desc: {
    zh: '这台设备和云端都有对方没有的修改,自动同步可能会丢数据,请选择保留哪一份(另一份会被覆盖)。',
    en: 'This device and the cloud each have changes the other doesn\'t — syncing automatically could lose data. Pick which version to keep (the other will be overwritten).',
  },
  sync_keep_local: { zh: '保留本机', en: 'Keep this device' },
  sync_keep_remote: { zh: '保留云端', en: 'Keep the cloud' },
  sync_desc_on: { zh: '通过账号在多设备间同步。', en: 'Synced across your devices via your account.' },
  sync_desc_off: { zh: '仅保存在这台设备上。', en: 'Saved on this device only.' },
  sync_now: { zh: '立即同步', en: 'Sync now' },
  sync_intro: {
    zh: '登录账号即可在多设备间同步数据,换手机也不怕丢。',
    en: 'Log in to sync across devices — your data survives a phone switch.',
  },
  sync_username: { zh: '用户名', en: 'Username' },
  sync_email: { zh: '邮箱', en: 'Email' },
  sync_email_hint: { zh: '仅用于以后找回账号,不用于登录。', en: 'Only used for account recovery — not for logging in.' },
  sync_password: { zh: '密码', en: 'Password' },
  sync_login: { zh: '登录', en: 'Log in' },
  sync_signup: { zh: '注册', en: 'Sign up' },
  sync_switch_signup: { zh: '没有账号?注册', en: 'No account? Sign up' },
  sync_switch_login: { zh: '已有账号?登录', en: 'Have an account? Log in' },
  sync_email_required: { zh: '请先填写邮箱。', en: 'Enter your email first.' },
  sync_logout: { zh: '退出登录', en: 'Log out' },
  sync_confirm: { zh: '确认', en: 'Confirm' },
  sync_confirm_hint: { zh: '验证码已发到你的邮箱,填进来完成注册。', en: 'We emailed you a code — enter it to finish signing up.' },
  sync_code: { zh: '验证码', en: 'Verification code' },
  sync_resend: { zh: '重新发送', en: 'Resend code' },
  sync_code_sent: { zh: '验证码已发送,请查收邮箱。', en: 'Code sent — check your email.' },
  sync_forgot: { zh: '忘记密码?', en: 'Forgot password?' },
  sync_send_code: { zh: '发送验证码', en: 'Send code' },
  sync_reset_hint: { zh: '验证码已发到你注册时填的邮箱,填进来并设置新密码。', en: 'We emailed a code to your registered address — enter it and set a new password.' },
  sync_new_password: { zh: '新密码', en: 'New password' },
  sync_reset_submit: { zh: '重置密码', en: 'Reset password' },
  data: { zh: '数据', en: 'Data' },
  export_backup: { zh: '导出备份', en: 'Export backup' },
  import: { zh: '导入', en: 'Import' },
  clear_all: { zh: '清空所有数据', en: 'Clear all data' },
  confirm_clear: { zh: '删除全部并重置设置?此操作不可撤销。', en: 'Delete everything and reset settings? This cannot be undone.' },
  import_bad: { zh: '该文件无法作为有余备份读取。', en: 'That file could not be read as a Margin backup.' },

  // Recurring bills
  fixed_bills: { zh: '固定账单', en: 'Fixed bills' },
  tab_bills: { zh: '账单', en: 'Bills' },
  fixed_empty: { zh: '房租、订阅…加进来会在每个周期自动扣。', en: "Rent, subscriptions… added here they're deducted automatically each cycle." },
  day_of: { zh: '每月 {d} 号 · {c}', en: 'Day {d} · {c}' },
  pause: { zh: '暂停', en: 'Pause' },
  resume: { zh: '恢复', en: 'Resume' },
  add_fixed: { zh: '+ 添加固定账单', en: '+ Add a fixed bill' },
  bill_name: { zh: '名称', en: 'Name' },
  bill_name_ph: { zh: '如:房租、Netflix', en: 'e.g. Rent, Netflix' },
  bill_hint: {
    zh: '固定账单会在每个周期到期日自动入账,未到期的金额会先从"本月可花"里预留出来,让剩余额度更真实。',
    en: 'Fixed bills post automatically on their due day each cycle. Upcoming ones are reserved against "left to spend" so your balance stays honest.',
  },
  charged_day: { zh: '每月扣费日', en: 'Charged on day' },
  add_bill: { zh: '添加', en: 'Add bill' },
  add_bill_title: { zh: '添加固定账单', en: 'Add a fixed bill' },
  edit_bill_title: { zh: '编辑固定账单', en: 'Edit fixed bill' },
  save_bill: { zh: '保存', en: 'Save' },
  delete_bill: { zh: '删除账单', en: 'Delete bill' },
  confirm_delete_bill: {
    zh: '删除"{name}"?已经入账的记录不受影响。',
    en: 'Delete "{name}"? Charges already posted are unaffected.',
  },
  bill_paused_hint: {
    zh: '已暂停:这笔账单不会自动入账,也不会从"本月可花"里预留。',
    en: "Paused: this bill won't post automatically, and nothing is reserved from \"left to spend\".",
  },
  cancel: { zh: '取消', en: 'Cancel' },
  err_bill_name: { zh: '给账单起个名字。', en: 'Give the bill a name.' },
  err_day: { zh: '日期需为 1–31。', en: 'Day must be 1–31.' },
  bills_count_short: { zh: '{v} 项 · 每月', en: '{v} · monthly' },
  reserved_this_month: { zh: '本月已从余额预留', en: "Reserved from this month's balance" },
  auto_charge_hint: { zh: '到期后自动入账,无需手动记。', en: 'Posts automatically when due — no need to log it.' },
  due_soon: { zh: '待扣', en: 'Upcoming' },
  paused_bills: { zh: '已暂停', en: 'Paused' },
  posted_status: { zh: '已入账', en: 'Posted' },
  days_after: { zh: '{v} 天后', en: 'in {v} days' },

  // Categories (user-editable)
  manage_categories: { zh: '分类', en: 'Categories' },
  category_add_ph: { zh: '新分类名称', en: 'New category name' },
  category_add: { zh: '+ 添加分类', en: '+ Add category' },
  category_rename: { zh: '改名', en: 'Rename' },
  category_last_one: { zh: '至少保留一个分类。', en: 'Keep at least one category.' },
  category_count: { zh: '{v} 个分类', en: '{v} categories' },
  bills_count: { zh: '{v} 个固定账单', en: '{v} fixed bills' },
  resets_on_day: { zh: '每月 {v} 号重置', en: 'Resets on day {v}' },
  not_signed_in: { zh: '未登录', en: 'Not signed in' },
  category_hint: {
    zh: '改名会同步更新已记录的账目;删除不会影响历史记录,只是以后选不到了。',
    en: "Renaming updates past entries too; deleting doesn't touch history — it just won't show up as a choice anymore.",
  },
  category_edit: { zh: '编辑', en: 'Edit' },
  delete_category: { zh: '删除分类', en: 'Delete category' },
  confirm_delete_category: { zh: '删除分类"{name}"?这个分类下的账目和账单会转入其他分类。', en: 'Delete category "{name}"? Its expenses and bills will move to another category.' },
  records_count: { zh: '{v} 笔', en: '{v} records' },
  category_no_records: { zh: '这个月这个分类还没有记录。', en: 'No records in this category this month.' },
  search_placeholder: { zh: '搜索备注或分类', en: 'Search notes or category' },
  search_no_results: { zh: '没有找到匹配的记录。', en: 'No records match your search.' },

  // Stats
  tab_ledger: { zh: '账目', en: 'Ledger' },
  tab_stats: { zh: '统计', en: 'Stats' },
  stat_perday: { zh: '日均 {v}', en: '{v}/day' },
  stat_by_category: { zh: '按分类', en: 'By category' },
  stat_daily: { zh: '每日花销', en: 'Daily spend' },
  stat_spent_this_month: { zh: '本月已花', en: 'Spent this month' },
  stat_usage_pct: { zh: '用量%', en: 'Usage %' },
  stat_perday_daysleft: { zh: '日均 {p} · 还剩 {d} 天', en: '{p}/day · {d} days left' },

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
