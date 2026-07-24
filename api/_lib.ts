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
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}
