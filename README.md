# 有余 · Margin

*Your monthly room to spend. （有余：还剩多少能花，给自己留点余地。）*

A dead-simple monthly-budget expense tracker.

The idea: **no matter how many bank accounts or cards you have, you only manage
one number** — a single monthly budget. You log what you spend, and the app
constantly shows how much is left, how many days remain, and roughly how much
you can spend per day to stay on track. It nudges you when you get close to the
limit and warns you when you go over.

## Why it's different

Most budgeting apps make you connect and reconcile every account. Margin
deliberately does the opposite. Accounts are irrelevant. There is one budget,
one running total, and one clear answer to "can I afford this right now?"

## Features (MVP)

- **One monthly budget** you set once (change it anytime in Settings).
- **Fast expense logging** — amount, quick category chips, optional note, date.
- **Live dashboard** — money left, % of budget used, progress bar, and a
  suggested safe daily spend.
- **Smart reminders** — a friendly line that shifts from "on track" to
  "careful" to "over budget" based on your threshold.
- **Fixed bills** — add rent, subscriptions, etc.; each is deducted
  automatically on its day, and upcoming ones are *reserved* against your
  remaining balance so "left to spend" stays honest.
- **Custom cycle** — the budget doesn't have to reset on the 1st. Set your
  payday (e.g. the 15th) and each cycle runs 15th → 14th.
- **中文 / English** — the whole UI is bilingual and defaults to Chinese;
  switch anytime in Settings.
- **Scan a receipt** — snap a photo and an AI vision model (Claude) reads the
  merchant, line items, tax, tip, and total, then drops it into an editable
  draft you confirm in one tap.
- **Speak an expense** — tap the mic and say "twelve forty on lunch today"; the
  browser transcribes it and Claude turns it into a structured entry. Works in
  any language.
- **Local & private** — your budget and expenses are stored in your browser via
  `localStorage`. Only receipt images / voice transcripts you explicitly scan
  are sent to the AI endpoint; nothing else leaves your device.
- **Installable** — it's a PWA, so you can add it to your phone's home screen.

## Design

The look is an editorial **"ledger"** aesthetic — a warm paper background, large
[Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) numbers,
uppercase hairline labels, thin dividers, and muted earthy category dots. It
ships with light, dark, and system themes (toggle in the header or Settings).
The style deliberately mirrors the companion *Nook* app so the two feel like one
family.

## Tech stack

- [Vite](https://vite.dev/) + [React 18](https://react.dev/) + TypeScript
- No runtime dependencies beyond React — the budget logic is plain, testable
  functions in `src/lib/`.
- Fonts (Instrument Serif + Geist Mono) load from Google Fonts.

## Getting started

```bash
npm install
npm run dev      # UI only (http://localhost:5173) — no AI endpoints
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build locally
```

### Enabling Scan + Voice (the AI features)

The scan and voice features call serverless functions in `api/`, which use
**Alibaba DashScope (Tongyi Qwen)** — a domestic provider that works from
mainland China. You need a `DASHSCOPE_API_KEY`.

```bash
cp .env.example .env.local     # then paste your DASHSCOPE_API_KEY
npm i -g vercel
vercel dev                     # serves the app AND the /api functions
```

Get a key from the [DashScope / 百炼 console](https://dashscope.console.aliyun.com/).
Receipts use `qwen-vl-max` (vision); voice/typed notes use `qwen-plus`. Both are
overridable via `AI_VISION_MODEL` / `AI_TEXT_MODEL`. Because the endpoint is
OpenAI-compatible, you can point `AI_BASE_URL` at another domestic provider
(Zhipu GLM, Kimi, Doubao) and just change the model names.

Plain `npm run dev` still works for everything except the AI endpoints — those
show a friendly "AI not configured" message.

> **Voice in China:** browser dictation (Web Speech API) routes through Google
> and won't work on the mainland, so the Speak tab automatically falls back to a
> text box — you type "午饭花了 25 块" and Qwen turns it into an entry. A native
> domestic speech-to-text (iFlytek / Aliyun ASR) can be wired in later.

### Cloud sync (optional)

By default all data lives in your browser (`localStorage`) — nothing is sent to
any server except the receipt image / text you explicitly scan. To sync across
devices, create a **LeanCloud (国内版)** app and set the `VITE_LEANCLOUD_*`
values in `.env.local`. When present, Margin signs in anonymously and keeps your
data in sync (last-write-wins); when absent, it stays fully local.

> Hosting note: a China-hosted domain needs ICP 备案. Vercel works from the
> mainland without 备案 but can be slower; for production you may prefer 腾讯云 /
> 阿里云 static hosting + serverless functions.

## Project structure

```
api/                 # Vercel serverless functions (AI, via Qwen/DashScope)
  _lib.ts            # OpenAI-compatible provider + model + categories
  receipt.ts         # POST image  → structured receipt (qwen-vl-max)
  voice.ts           # POST transcript → structured expense (qwen-plus)
src/
  lib/
    types.ts          # domain types (Expense, Settings, Profile, AppState)
    receipt.ts        # receipt + draft shapes, receiptSummary
    ai.ts             # client calls to /api/receipt and /api/voice
    useSpeech.ts      # Web Speech API dictation hook
    storage.ts        # localStorage load/save + id helpers
    sync.ts           # optional LeanCloud cloud adapter (env-gated)
    useSync.ts        # pull-on-load + debounced push hook
    budget.ts         # month math, budget summary, reminder logic
    format.ts         # money / date formatting helpers
    categories.ts     # the fixed category list
    categoryColors.ts # earthy dot palette
    currencies.ts     # currency options (CNY first)
    image.ts          # avatar resize/crop to a small data URL
    theme.ts          # light / dark / system theme handling
  components/
    BudgetCard.tsx     # the serif "left to spend" hero + reminder
    EntrySection.tsx   # Type / Scan / Speak segmented control
    ExpenseForm.tsx    # reusable editable expense form
    ScanPanel.tsx      # receipt capture → scan → confirm
    VoicePanel.tsx     # dictation / typing → analyze → confirm
    DraftHeader.tsx    # merchant / items readout above a draft
    ExpenseList.tsx    # this month's ledger rows
    SettingsPage.tsx   # profile, budget, currency, theme, sync, data
  App.tsx         # state, persistence, sync, routing
  main.tsx        # React entry point
  styles.css      # the ledger design system
```

## Roadmap ideas

- A minimal stats view (spend-by-category, a daily sparkline).
- Real push notifications for the "you're close to your limit" reminder.
- Per-category caps.
- Native domestic speech-to-text for the Speak tab.
- Export to CSV, and carry-over of leftover budget into the next cycle.

## License

MIT © qliclover — see [LICENSE](./LICENSE).
