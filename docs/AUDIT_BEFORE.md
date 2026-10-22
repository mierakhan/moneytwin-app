# Audit before changes — MoneyTwin AI

Discovery date: 22 October 2026. Inspected on the machine where it runs, not from assumptions.

## Actual stack

| Layer | What exists |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript, React Router 6, Tailwind CSS v4 (`@theme` tokens), Recharts 2, `react-markdown` + `remark-gfm`, lucide-react icons |
| State | React context only. `AuthContext` (session), `ToastProvider`, `I18nProvider` (EN/BM dictionary), `ChatContext` (assistant thread) |
| Backend | FastAPI 0.159, SQLAlchemy 2, Pydantic 2, Argon2id, server-side session rows in SQLite |
| Database | SQLite at `backend/data/moneytwin.db`, integer sen columns (`amount_minor`, `limit_minor`, `target_minor`, `saved_minor`). Alembic migration `883845f421b0` mirrors the schema for PostgreSQL |
| AI | Flowise agentflow `a2c0e1a6-c2c8-43e0-987e-f6632cc5dcf5` at flowise.bdctraining.cloud, called server-side only |
| Auth | HttpOnly session cookie + double-submit CSRF header; no JWT in the browser |

## Routes

Frontend: `/`, `/signin`, `/signup`, `/app` (dashboard), `/app/transactions`, `/app/budgets`,
`/app/goals`, `/app/simulator`, `/app/insights`, `/app/history`, `/app/chat`, `/app/settings`,
`/app/admin`.

Backend: `/api/auth/*`, `/api/transactions*`, `/api/budgets*`, `/api/goals*`,
`/api/simulations*`, `/api/dashboard`, `/api/history`, `/api/ai/{status,chat,analyze,brief,conversations,usage}`,
`/api/admin/*`, `/health`, `/ready`.

## Where each number is computed

All money maths is backend: `app/services/finance.py` (month ranges, totals, budgets, goals,
simulation, history) and `app/routers/ai_routes.py` (facts passed to the model). The frontend
only formats amounts with `Intl`-style helpers and draws charts. The AI receives JSON facts and
returns prose; it never computes a balance.

## Findings against the checklist

| Check | Result before this pass | Action |
|---|---|---|
| a) Floats for money | No. Integer sen everywhere, `Decimal` in simulation | Confirmed with `test_money_rounds_to_sen` |
| b) KL month boundaries | Dates stored as `DATE`; month ranges from a single helper. A 23:30 entry on 31 Oct belongs to October because the date is 31 Oct | Added boundary test (31 Oct vs 1 Nov) |
| c) Overspending total | **Bug.** Dashboard showed only the first over-budget category; no total existed | Fixed: `over_budgets[]` + `overspending_total` computed once, used by dashboard, budgets summary and insights |
| d) Percent change with zero base | Backend returned `percent: null`, but the UI could print an em-less blank and the delta alone | Kept `null`, UI prints "No previous data" / "—"; tested |
| e) Budgeted vs unbudgeted categories | **Gap.** Unbudgeted spending was invisible on Budgets | Added `unbudgeted[]` to dashboard + budgets summary and a dedicated section with a "Set budget" action |
| f) Simulation writing to real tables | No. Endpoints are read-only; a test asserts row counts and totals unchanged | Kept, tested |
| g) Two chatbot implementations | **Gap.** The floating button was a link to `/app/chat`; there was no popup | One `ChatProvider`, one endpoint, two surfaces (dock + page) |
| h) Frontend sending financial data to AI | No. Only `message`, `conversation_id`, `locale` are sent | Confirmed; server builds context |
| i) Flowise session scoping | Session id derives from user + conversation on the server | Confirmed in `ai.py` |
| j) Secrets client-side | None found in the built bundle (`FLOWISE`, `sk-`, `APP_SECRET_KEY` scan) | Re-verified after the redesign |
| k) Deletion cascade / export | Deletion cascades via FK. Export is a client-side JSON assembly, not covered by a test | Noted as partial |
| l) Dated goal contributions | No. Goals store a single `saved_minor` balance, no contribution history | Not modelled; documented as a known limitation rather than faked |

## Bugs found and fixed in this pass

1. `GET /api/ai/analyze` raised `KeyError: spent_minor` (context budgets were trimmed) → 500.
2. The grounding validator rejected correct arithmetic (`RM900 − RM300 = RM600`) → now allows pairwise sums/differences and amounts the user typed.
3. Dashboard overspending used the top category only.
4. `/api/budgets/summary` had no unbudgeted view and no overspending total.
5. Insights showed long prose first, with no short summary or expandable detail.
6. Chat state lived inside the page component, so navigating lost the thread.

## Measured state at discovery

- Backend tests: 32 passing; no overspending-total or unbudgeted tests.
- Frontend: `tsc` clean, production build succeeded.
- Responsive: 375 px dashboard had no horizontal overflow; mobile nav present.
- Console: no errors after the Tailwind `@apply btn` fix.

## What was not verifiable

Browser automation could not run because the local Brave profile was locked by a running
instance, so screenshots at 375/768/1280 were not captured in this session. Verification was
done through API responses, route status codes, type-checking and the production build.
