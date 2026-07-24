import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateObject } from 'ai'
import { z } from 'zod'
import { visionModel, hasKey, CATEGORIES, todayISO } from './_lib.js'

const receiptSchema = z.object({
  merchant: z.string().describe('Store or merchant name'),
  date: z.string().nullable().describe('Receipt date as YYYY-MM-DD, null if not found'),
  currency: z.string().nullable().describe('Currency code like USD/EUR, null if unknown'),
  items: z
    .array(
      z.object({
        name: z.string().describe('Item name'),
        price: z.number().describe('Item price as a number'),
      }),
    )
    .describe('Line items on the receipt'),
  subtotal: z.number().nullable().describe('Subtotal, null if not present'),
  discount: z.number().nullable().describe('Discount as a positive number, null if none'),
  tax: z.number().nullable().describe('Tax amount, null if none'),
  shipping: z.number().nullable().describe('Shipping fee, null if none'),
  tips: z.number().nullable().describe('Tip amount, null if none'),
  total: z.number().describe('Final total actually paid, number only'),
  category: z
    .enum(CATEGORIES as [string, ...string[]])
    .describe('Best-fit spending category from the allowed list'),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!hasKey()) {
    res.status(503).json({
      error: 'AI is not configured. Set DASHSCOPE_API_KEY to enable receipt scanning.',
    })
    return
  }

  try {
    const { image } = (req.body ?? {}) as { image?: string }
    if (!image) {
      res.status(400).json({ error: 'No image provided.' })
      return
    }

    const { object } = await generateObject({
      model: visionModel(),
      schema: receiptSchema,
      mode: 'json',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `This is a photo of a receipt. Extract its details into the schema. ` +
                `Money fields are numbers only (no currency symbols). Use null for anything ` +
                `not present. If the date is missing, use ${todayISO()}. ` +
                `Pick the single best category from: ${CATEGORIES.join(', ')}.`,
            },
            { type: 'image', image },
          ],
        },
      ],
    })

    res.status(200).json({ receipt: object })
  } catch (err) {
    console.error('receipt scan failed:', err)
    res.status(500).json({ error: 'Could not read that receipt. Try a clearer photo.' })
  }
}
