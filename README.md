# Tracking

A dead-simple monthly-budget expense tracker.

The idea: **no matter how many bank accounts or cards you have, you only manage
one number** — a single monthly budget. You log what you spend, and the app
constantly shows how much is left, how many days remain, and roughly how much
you can spend per day to stay on track. It nudges you when you get close to the
limit and warns you when you go over.

## Why it's different

Most budgeting apps make you connect and reconcile every account. Tracking
deliberately does the opposite. Accounts are irrelevant. There is one budget,
one running total, and one clear answer to "can I afford this right now?"

## Features (MVP)

- **One monthly budget** you set once (change it anytime in Settings).
- **Fast expense logging** — amount, quick category chips, optional note, date.
- **Live dashboard** — money left, % of budget used, progress bar, and a
  suggested safe daily spend.
- **Smart reminders** — a friendly line that shifts from "on track" to
  "careful" to "over budget" based on your threshold.
- **Automatic month view** — the app always shows the current calendar month;
  past expenses stay in history.
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

The scan and voice features call serverless functions in `api/`, which need an
Anthropic API key. They run on Vercel (or locally via the Vercel CLI):

```bash
cp .env.example .env.local     # then paste your ANTHROPIC_API_KEY
npm i -g vercel
vercel dev                     # serves the app AND the /api functions
```

Deploy with `vercel` (or connect the repo in the Vercel dashboard) and set
`ANTHROPIC_API_KEY` in the project's Environment Variables. Plain `npm run dev`
still works for everything except the AI endpoints — those will show a friendly
"AI not configured" message.

> Note: voice dictation uses the browser's Web Speech API for speech-to-text
> (best support in Chrome and Safari); the transcript is then parsed by Claude.
> If the API isn't available, the Speak tab falls back to a text field.

## Project structure

```
api/                 # Vercel serverless functions (AI)
  _lib.ts            # shared model config + categories
  receipt.ts         # POST image  → structured receipt (Claude vision)
  voice.ts           # POST transcript → structured expense (Claude)
src/
  lib/
    types.ts          # domain types (Expense, Settings, AppState)
    receipt.ts        # receipt + draft shapes, receiptSummary
    ai.ts             # client calls to /api/receipt and /api/voice
    useSpeech.ts      # Web Speech API dictation hook
    storage.ts        # localStorage load/save + id helpers
    budget.ts         # month math, budget summary, reminder logic
    format.ts         # money / date formatting helpers
    categories.ts     # the fixed category list
    categoryColors.ts # earthy dot palette
    theme.ts          # light / dark / system theme handling
  components/
    BudgetCard.tsx     # the serif "left to spend" hero + reminder
    EntrySection.tsx   # Type / Scan / Speak segmented control
    ExpenseForm.tsx    # reusable editable expense form
    ScanPanel.tsx      # receipt capture → scan → confirm
    VoicePanel.tsx     # dictation → analyze → confirm
    DraftHeader.tsx    # merchant / items readout above a draft
    ExpenseList.tsx    # this month's ledger rows
    SettingsDialog.tsx # budget / currency / warn threshold / theme
  App.tsx         # state, persistence, and layout
  main.tsx        # React entry point
  styles.css      # the ledger design system
```

## Roadmap ideas

- Recurring/scheduled expenses (subscriptions, rent) auto-deducted each month.
- Real push notifications for the "you're close to your limit" reminder.
- Categories with per-category caps and simple charts.
- Optional cloud sync so the same budget follows you across devices.
- Export to CSV.

## License

MIT © qliclover — see [LICENSE](./LICENSE).
