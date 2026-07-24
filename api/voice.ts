import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateObject } from 'ai'
import { z } from 'zod'
import { textModel, hasKey, CATEGORIES, todayISO } from './_lib.js'

const draftSchema = z.object({
  amount: z.number().describe('Total amount spent, number only'),
  category: z
    .enum(CATEGORIES as [string, ...string[]])
    .describe('Best-fit spending category from the allowed list'),
  note: z.string().describe('Short human-readable note, e.g. "lunch with team"'),
  date: z.string().describe('Date as YYYY-MM-DD; resolve relative words like "yesterday"'),
  merchant: z.string().nullable().describe('Merchant/place if mentioned, else null'),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!hasKey()) {
    res.status(503).json({
      error: 'AI is not configured. Set DASHSCOPE_API_KEY to enable voice entry.',
    })
    return
  }

  try {
    const { transcript } = (req.body ?? {}) as { transcript?: string }
    if (!transcript || !transcript.trim()) {
      res.status(400).json({ error: 'No transcript provided.' })
      return
    }

    const { object } = await generateObject({
      model: textModel(),
      schema: draftSchema,
      messages: [
        {
          role: 'user',
          content:
            `Turn this spoken expense into a structured entry. Today is ${todayISO()}. ` +
            `Amount is a number only. Pick the best category from: ${CATEGORIES.join(', ')}. ` +
            `Resolve relative dates (e.g. "yesterday") to YYYY-MM-DD. ` +
            `The person may speak any language.\n\nSpoken: "${transcript.trim()}"`,
        },
      ],
    })

    res.status(200).json({ draft: object })
  } catch (err) {
    console.error('voice parse failed:', err)
    res.status(500).json({ error: 'Could not understand that. Try again.' })
  }
}
