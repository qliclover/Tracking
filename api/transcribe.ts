import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hasKey } from './_lib.js'

const BASE_URL = process.env.AI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'

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
    const { audio } = (req.body ?? {}) as { audio?: string }
    if (!audio) {
      res.status(400).json({ error: 'No audio provided.' })
      return
    }

    const model = process.env.AI_ASR_MODEL || 'qwen3-asr-flash'
    const r = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [{ type: 'input_audio', input_audio: { data: audio } }],
          },
        ],
      }),
    })

    if (!r.ok) {
      const errText = await r.text().catch(() => '')
      console.error('transcribe failed:', r.status, errText)
      res.status(502).json({ error: 'Could not transcribe that recording.' })
      return
    }

    const data = (await r.json()) as {
      choices?: { message?: { content?: string | { text?: string }[] } }[]
    }
    const content = data.choices?.[0]?.message?.content
    const transcript = Array.isArray(content)
      ? content.map((p) => (typeof p === 'string' ? p : p?.text ?? '')).join('')
      : String(content ?? '')

    if (!transcript.trim()) {
      res.status(502).json({ error: 'Could not transcribe that recording.' })
      return
    }

    res.status(200).json({ transcript: transcript.trim() })
  } catch (err) {
    console.error('transcribe failed:', err)
    res.status(500).json({ error: 'Could not transcribe that recording.' })
  }
}
