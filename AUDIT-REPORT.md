# MoneyTwin AI — Audit report

Audit date: 22 October 2026. Application inspected at `moneytwin-app`, running on
http://localhost:5173 with the API on http://localhost:8000 and the Flowise agentflow
`a2c0e1a6-c2c8-43e0-987e-f6632cc5dcf5`.

Statuses: **PASS** working and exercised, **PARTIAL** works with a stated gap,
**FAIL** does not meet the requirement, **NOT TESTED** no evidence either way.

## Feature audit

| # | Feature | Status | Evidence / gap |
|---|---|---|---|
| 1 | Authentication and account management | PASS | Register, sign in, sign out, demo, profile update, account delete. Argon2id hashes, server sessions, CSRF enforced, 429 after repeated failures. |
| 2 | Income and expense tracking | PASS | CRUD with owner checks, month/category/type/search filters, refund flag nets against the category, negative amounts rejected 422, duplicates blocked 409. |
| 3 | Monthly budgets | PASS | Per category and month, duplicate POST updates instead of inserting, limit cannot be negative, remaining/overspend/percent computed server-side. |
| 4 | Overspending alerts | PASS | 80%+, at-limit and over states on cards, dashboard alert strip, toasts at 80% and over; tested at 115.62%. |
| 5 | Savings goals | PARTIAL | Create, contribute, delete, progress, monthly requirement, overdue handling. No edit form in the UI although the PATCH endpoint exists, and no "estimated completion date". |
| 6 | What-if simulation | PARTIAL | Deterministic projection, one-off in month 1, assumptions, save endpoint. Saved scenarios have no list UI yet and no scenario-to-scenario comparison. |
| 7 | AI expense analysis | PASS | `/api/ai/brief` (3 findings + one action) and `/api/ai/analyze`, both grounded. Live Flowise reply at 14:44 on 22 Oct returned `status: ok`. |
| 8 | AI finance chatbot | PASS | Floating widget on every authenticated page plus the full page, one shared conversation store, BM/EN, refusals, computed fallback. |
| 9 | Dashboard | PASS | Summary line, balance hero, budget bar, quick overview, alerts, trend, category donut, recent rows, goals, quick actions. |
| 10 | English and Bahasa Melayu | PASS | UI dictionary and AI replies in both languages; verified with a real BM answer. |
| 11 | User isolation | PASS | Cross-user GET/PATCH/DELETE return 404; history and dashboard are scoped; automated test `test_sec01`. |
| 12 | Responsive design | PASS | 375 px viewport: no horizontal overflow, mobile header, bottom nav, floating chat becomes full screen. |

## Data integrity checks

| Check | Status | Evidence |
|---|---|---|
| Income − expenses = displayed balance | PASS | Demo: 2,500 − 1,612.50 = 887.50 on dashboard, transactions and history. |
| Budget overage | PASS | RM400 limit, RM462.50 spend → 115.62%, RM62.50 over. |
| Month-over-month change | PASS | September 1,570.00 → October 1,612.50 = +42.50 (+2.7%). |
| Missing months are not invented | PASS | August 2026 returns zeros with `has_data: false`; history row says "No records". |
| Simulation does not mutate records | PASS | Dashboard totals unchanged after a run. |
| Savings contributions are not expenses | PASS | Goals store `saved_minor` separately; ledger untouched. |

## Security checks

| Check | Status | Evidence |
|---|---|---|
| Secrets server-side | PASS | Bundle scan for `FLOWISE`, `sk-`, `APP_SECRET_KEY` returns nothing. |
| CSRF on mutations | PASS | Missing header → 403. |
| Rate limiting | PASS | Login 429 after repeated attempts; AI limits 10/min, 100/day. |
| Admin cannot read private records | PASS | `/api/admin/metrics` returns aggregates only; test asserts 403 for owners. |
| Export and deletion | PARTIAL | JSON export is client-side; account delete cascades. Export not covered by an automated test. |

## Gaps worth fixing next

1. Goal editing and an estimated completion date.
2. Saved-scenario list and side-by-side comparison.
3. CSV import with duplicate detection.
4. Explicit labels for planned income (Settings) versus recorded income (ledger); the dashboard currently only shows recorded figures.
5. Category creation UI (backend schema exists, no route or form yet).

## Test evidence

- Backend: `pytest -q` → 37 passed (auth, isolation, finance, goals, simulation, AI grounding, history, brief).
- Frontend: `tsc --noEmit` clean, `vite build` succeeds.
- Live API checks on 22 Oct 2026: `/api/history?months=3`, dashboard `previous`, `/api/ai/brief`.
