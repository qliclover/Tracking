import { Category } from './types'
import { colorForIndex } from './categoryColors'
import { translate, Lang } from './i18n'

/** English keys for the built-in categories — used only to seed the editable list on first run. */
const DEFAULT_KEYS = ['Food', 'Transport', 'Shopping', 'Bills', 'Fun', 'Other'] as const

const DEFAULT_TK: Record<(typeof DEFAULT_KEYS)[number], string> = {
  Food: 'cat_Food', Transport: 'cat_Transport', Shopping: 'cat_Shopping',
  Bills: 'cat_Bills', Fun: 'cat_Fun', Other: 'cat_Other',
}

/** The starter category list, seeded once (in the given language) for new/legacy installs. */
export function defaultCategories(lang: Lang): Category[] {
  return DEFAULT_KEYS.map((key, i) => ({
    name: translate(DEFAULT_TK[key], lang),
    color: colorForIndex(i),
  }))
}

// Reverse lookup: either language's translation of a built-in category name -> its key.
const NAME_TO_KEY: Record<string, (typeof DEFAULT_KEYS)[number]> = {}
for (const key of DEFAULT_KEYS) {
  NAME_TO_KEY[translate(DEFAULT_TK[key], 'zh')] = key
  NAME_TO_KEY[translate(DEFAULT_TK[key], 'en')] = key
}

/**
 * Display label for a stored category name. Built-in categories (still at one
 * of their two translated names, i.e. never renamed) follow the current UI
 * language; anything else — a rename, or a category the user typed themselves
 * — has no translation, so it's shown exactly as stored.
 */
export function categoryDisplay(name: string, lang: Lang): string {
  const key = NAME_TO_KEY[name]
  return key ? translate(DEFAULT_TK[key], lang) : name
}

/**
 * The AI endpoints only know the fixed English keys (Food/Transport/...), since
 * they can't see the user's editable list. Map whatever they return onto a real
 * category the user still has — by exact name, then by legacy key in either
 * language, falling back to the last category ("Other" in the default set).
 */
export function resolveAiCategory(raw: string | null | undefined, categories: readonly Category[]): string {
  const last = categories[categories.length - 1]?.name ?? ''
  if (!raw) return last
  if (categories.some((c) => c.name === raw)) return raw
  const key = DEFAULT_KEYS.find((k) => k === raw)
  if (key) {
    const zh = translate(DEFAULT_TK[key], 'zh')
    const en = translate(DEFAULT_TK[key], 'en')
    const match = categories.find((c) => c.name === zh || c.name === en)
    if (match) return match.name
  }
  return last
}
