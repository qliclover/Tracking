import { anthropic } from '@ai-sdk/anthropic'
import type { LanguageModel } from 'ai'

/**
 * The model used for both receipt vision and voice parsing.
 * Override with the AI_MODEL env var. The default is a stable, vision-capable
 * Claude model. Requires ANTHROPIC_API_KEY to be set in the environment.
 */
export function model(): LanguageModel {
  const id = process.env.AI_MODEL || 'claude-3-5-sonnet-latest'
  return anthropic(id)
}

export function hasKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/** Categories the model should choose from when tagging an expense. */
export const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Fun', 'Other']

/** Today's date as YYYY-MM-DD, used as a default and to steer relative dates. */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}
