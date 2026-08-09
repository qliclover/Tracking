import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { LanguageModel } from 'ai'

/**
 * AI provider: Alibaba DashScope (Tongyi Qwen) via its OpenAI-compatible API.
 * Works from mainland China. Requires DASHSCOPE_API_KEY.
 *
 * Because it's OpenAI-compatible, you can point this at any compatible domestic
 * provider (Zhipu, Kimi, Doubao, …) by overriding AI_BASE_URL + the model names.
 */
const BASE_URL =
  process.env.AI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'

function provider() {
  return createOpenAICompatible({
    name: 'dashscope',
    baseURL: BASE_URL,
    apiKey: process.env.DASHSCOPE_API_KEY,
  })
}

/** Vision-capable model for reading receipt photos. */
export function visionModel(): LanguageModel {
  const id = process.env.AI_VISION_MODEL || 'qwen-vl-max'
  return provider()(id)
}

/** Text model for parsing a spoken/typed expense. */
export function textModel(): LanguageModel {
  const id = process.env.AI_TEXT_MODEL || 'qwen-plus'
  return provider()(id)
}

export function hasKey(): boolean {
  return Boolean(process.env.DASHSCOPE_API_KEY)
}

/** Categories the model should choose from when tagging an expense. */
export const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Fun', 'Other']

/** Today's date as YYYY-MM-DD. */
export function todayISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** True only for a real calendar date written as YYYY-MM-DD. */
export function isValidISODate(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [y, m, d] = v.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

/**
 * What "today" means for this request. These functions run on Vercel in UTC, so
 * the server's own date is not the user's: in UTC+8 it's still yesterday until
 * 08:00 local, and in UTC-7 it's already tomorrow after 17:00. The client sends
 * its local date — trust it, since every other date in the app (the ledger, the
 * budget cycle) already comes from that same device clock.
 */
export function anchorDate(clientToday: unknown): string {
  return isValidISODate(clientToday) ? clientToday : todayISO()
}

function shift(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return todayISO(new Date(y, m - 1, d + days))
}

/**
 * A lookup table of every date the model would otherwise have to derive itself.
 * Weekday arithmetic is the one thing it reliably gets wrong — asked on a
 * Saturday, "上周五" came back as a Saturday, and twice as two different wrong
 * days — so we hand it both weeks spelled out and let it look the answer up.
 */
export function dateContext(today: string): string {
  const [y, m, d] = today.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  const mondayThisWeek = -((dow + 6) % 7)
  const week = (start: number) =>
    Array.from({ length: 7 }, (_, i) => `${WEEKDAYS[(1 + i) % 7]} ${shift(today, start + i)}`).join(', ')

  return (
    `Today is ${today} (${WEEKDAYS[dow]}).\n` +
    `Resolve dates with this table — never compute weekdays yourself:\n` +
    `  today (今天) = ${today}\n` +
    `  yesterday (昨天) = ${shift(today, -1)}\n` +
    `  day before yesterday (前天) = ${shift(today, -2)}\n` +
    `  three days ago (大前天) = ${shift(today, -3)}\n` +
    `  this week (本周/这周), Mon-Sun: ${week(mondayThisWeek)}\n` +
    `  last week (上周/上个星期), Mon-Sun: ${week(mondayThisWeek - 7)}\n` +
    `A bare weekday ("周五", "on Friday") means the most recent one that has already ` +
    `happened, or today if today is that weekday. "上周五" means that weekday in the ` +
    `last-week row. With no date mentioned, use today. Never return a future date ` +
    `unless the person explicitly says the spending is upcoming. Output YYYY-MM-DD only.`
  )
}
