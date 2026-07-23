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
- **Local & private** — everything is stored in your browser via
  `localStorage`. No accounts, no server, no data leaves your device.
- **Installable** — it's a PWA, so you can add it to your phone's home screen.

## Tech stack

- [Vite](https://vite.dev/) + [React 18](https://react.dev/) + TypeScript
- No runtime dependencies beyond React — the budget logic is plain, tested-by-design
  functions in `src/lib/`.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build locally
```

## Project structure

```
src/
  lib/
    types.ts      # domain types (Expense, Settings, AppState)
    storage.ts    # localStorage load/save + id helpers
    budget.ts     # month math, budget summary, reminder text
    format.ts     # money / date formatting helpers
  components/
    BudgetCard.tsx     # the headline "left to spend" card
    AddExpense.tsx     # the log-an-expense form
    ExpenseList.tsx    # this month's expenses
    SettingsDialog.tsx # budget / currency / warn threshold
  App.tsx         # state, persistence, and layout
  main.tsx        # React entry point
```

## Roadmap ideas

- Recurring/scheduled expenses (subscriptions, rent) auto-deducted each month.
- Real push notifications for the "you're close to your limit" reminder.
- Categories with per-category caps and simple charts.
- Optional cloud sync so the same budget follows you across devices.
- Export to CSV.

## License

MIT © qliclover — see [LICENSE](./LICENSE).
