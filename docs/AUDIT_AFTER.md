# Audit after changes — MoneyTwin AI

Date: 22 October 2026. Scope: P0 correctness, unified assistant, history, insights, and the
first pass of the visual system. Later phases in the brief (drawers, presets, scenario compare,
animated counters, Playwright/Vitest, Lighthouse) are **not** done and are listed honestly at
the end.

## Summary of changes per page

| Page | Change |
|---|---|
| Dashboard | "This month in a line" summary with spend/keep split, teal balance hero with budget bar, quick overview, unbudgeted spending strip, total overspending across all over-budget categories, previous-month deltas available from the API |
| Transactions | Unchanged behaviour; restyled headings, pill filters, rounded cards |
| Budgets | New "Unbudgeted spending" section with a per-category "Set budget" action, total overspending card, summary endpoint now the data source |
| Goals | Missing deadline now reads as guidance with an inline date picker instead of "No valid period" |
| Simulation | Unchanged engine; UI follows the new tokens |
| AI Insights | Rebuilt: four snapshot cards, short AI brief (three findings + one action) with template fallback, budget-vs-actual chart, trend chart, recommendation cards linking to the right pages, collapsible detailed analysis with a category table |
| History (new) | 3/6/12-month toggle, previous-month comparison, income/expense bars, balance line, expandable month rows, honest "No records" state |
| Ask MoneyTwin | Now consumes the shared `ChatContext`; same thread as the floating dock |
| Every page | Floating assistant dock (navy panel, status dot, quick prompts, retry, new/clear chat, full screen on mobile) |
| Settings | Field relabelled "Planned monthly income" with the actual recorded income shown beside it |

## Bugs found and fixed

1. `KeyError: spent_minor` in `/api/ai/analyze` (500 for any month with a budget).
2. Grounding validator rejected correct arithmetic; now accepts verified sums/differences and user-supplied amounts.
3. Dashboard overspending total showed one category, not the sum of all over-budget categories.
4. No unbudgeted-spending view on Budgets.
5. Insights forced a long explanation before the key numbers.
6. Chat thread lost on navigation because state was page-local.
7. Chat message limit raised from 2000 to the specified 1000 characters (rejects with 422).

## Files changed

Backend: `app/services/finance.py` (`prev_month`, `shift_month`, `_change`, `month_history`,
`unbudgeted_spending`, dashboard additions), `app/routers/dashboard.py` (`/history`),
`app/routers/ai_routes.py` (`/brief`, fixes), `app/routers/budgets.py` (summary additions),
`app/schemas.py` (chat limit), `tests/test_p0_correctness.py`, `tests/test_history.py`.

Frontend: `src/state/ChatContext.tsx` (new), `src/components/FloatingChat.tsx` (new),
`src/components/Markdown.tsx` (new), `src/pages/History.tsx` (new),
`src/pages/Insights.tsx` (rewritten), `src/pages/Chat.tsx` (shared provider),
`src/pages/Dashboard.tsx`, `src/pages/Budgets.tsx`, `src/pages/Goals.tsx`,
`src/pages/Settings.tsx`, `src/components/AppShell.tsx`, `src/lib/i18n.tsx`,
`src/lib/types.ts`, `src/index.css`, `src/App.tsx`, `src/main.tsx`.

## Dependencies added

`react-markdown` + `remark-gfm` — the Flowise agent replies in markdown tables; rendering it as
plain text looked broken. Both are small, widely used, and render to React elements (no
`dangerouslySetInnerHTML`).

## Migrations and rollback

No schema changes were required: history, brief and unbudgeted spending are computed from
existing tables. The Alembic revision `883845f421b0` remains the single migration. Rollback for
code is a git revert; no data migration to undo.

Backups: `backend/data/moneytwin.db` can be copied while the API is stopped. No rows were
deleted or rewritten during this work.

## Test results

- Backend `pytest -q`: **46 passed** (was 32). New coverage: overspending across multiple
  categories, dashboard/insights agreement, unbudgeted separation, zero-base percentages,
  month boundary, chat length limit, ledger reconciliation, sen rounding, history windows,
  history change maths, history isolation, previous-month deltas, brief endpoint.
- Frontend `tsc --noEmit`: clean.
- `vite build`: succeeds (chunk-size warning only).
- Live API: `/api/history?months=12` → 12 rows, 2 with data; `/api/ai/brief` → `ai.status: ok`
  through the hosted Flowise flow; `/api/dashboard` previous-month deltas correct.

## Acceptance criteria mapping

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Existing features and data preserved | PASS | Same SQLite file, no migrations, all prior tests still pass |
| 2 | Totals agree across pages | PASS | `test_overspending_total_sums_every_over_budget_category`, `test_insights_and_dashboard_agree_on_overspending`, `test_transactions_and_dashboard_reconcile` |
| 3 | Simulation changes no rows | PASS | `test_sim02_simulation_does_not_mutate_ledger` |
| 4 | Floating chat on every page, shared thread, EN/BM, typing, retry | PARTIAL | Built and wired; typing/retry/status implemented. No automated browser test because the local browser profile is locked |
| 5 | No financial figures sent to AI, no secrets in bundle | PASS | Payload inspection, bundle scan |
| 6 | Insights summary 50–90 words, three findings, one action, validator + fallback | PARTIAL | Brief endpoint enforces the shape and validates amounts; word count is not strictly rejected, and the fallback is the deterministic template |
| 7 | History real data only, distinct "No records" | PASS | `test_history_returns_requested_window`, `has_data` flag, UI state |
| 8 | No NaN/Infinity in percent change | PASS | `test_percent_change_is_null_when_previous_month_empty` |
| 9 | Budgets separates unbudgeted; goals guide instead of "No valid period" | PASS | `test_unbudgeted_spending_is_separate`; UI copy changed |
| 10 | Settings separates planned vs actual income | PASS | Settings page shows both, actual pulled from `/api/dashboard` |
| 11 | Reduced motion, keyboard, AA contrast, axe | PARTIAL | Reduced-motion CSS and focus rings exist; no axe run |
| 12 | All backend/frontend/E2E tests pass; Lighthouse | PARTIAL | Backend and type checks pass; no Vitest/Playwright or Lighthouse run |
| 13 | Verified in the running app | PARTIAL | API and routes verified live; visual/interaction checks blocked by the locked browser profile |

## Known limitations

- Contribution history is not dated, so projected completion dates are not shown.
- No scenario comparison or saved-scenario list UI yet.
- No CSV import; export is JSON assembled in the browser and untested end to end.
- Animated counters, magnetic hover, page presets, drawers and undo toasts from the brief are not implemented.
- The dashboard's "records this month" and quick overview are informational cards, not the
  layered hierarchy the brief describes.
- No Playwright, Vitest, axe or Lighthouse evidence.

## Recommended next steps

1. Add a `goal_contributions` table (dated) so projections and milestones are honest.
2. Vitest for `ChatProvider` persistence and money formatting; Playwright for the dock on three pages.
3. Saved-scenario list, rename, compare.
4. Drawn-out accessibility pass with axe and a keyboard walkthrough.
