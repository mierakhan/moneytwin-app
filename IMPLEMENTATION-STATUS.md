# MoneyTwin AI — Implementation status

Last verified: 22 October 2026, local machine, Asia/Kuala_Lumpur.
Everything below was exercised against the running app, not inferred from code.

## Running now

- Frontend: http://localhost:5173 (Vite dev, `npm run dev`)
- API: http://localhost:8000 (`uvicorn app.main:app`), `/ready` reports
  `{"status":"ready","database":"ok","ai_provider":"flowise","ai_configured":true}`
- Database: SQLite at `backend/data/moneytwin.db` (PostgreSQL path + Alembic provided)
- AI: Flowise agentflow `a2c0e1a6-c2c8-43e0-987e-f6632cc5dcf5` at
  https://flowise.bdctraining.cloud, real DeepSeek replies confirmed

## Verified working

| Area | Evidence |
|---|---|
| Landing page | Rendered at `/`, hero + demo preview + FAQ, no console errors |
| Sign-up / sign-in / demo / sign-out | Registered a fresh account (201), session cookie + CSRF, 401 after logout |
| Password storage | `$argon2id$` hashes in the `users` table, no plain text |
| CSRF | Mutation without `X-CSRF-Token` → 403 |
| Login rate limiting | 14 failed attempts → HTTP 429 |
| Cross-user isolation | User B GET/PATCH/DELETE on user A's transaction → 404; A's row unchanged |
| Transaction create (UI) | Added "Lunch test" RM12.50 in the browser; totals moved 1,600.00 → 1,612.50, balance 900.00 → 887.50, toast shown |
| Negative amount | API rejects `-20.00` with 422, nothing stored |
| Refund handling | Refund row subtracts from category spend (unit test) |
| Budget math | RM400 limit + RM600 spend → remaining −200.00, overspend 200.00, 150%, state `over` (live API on a fresh user) |
| Budget thresholds | Demo data shows 80%+, 100% (at limit) and over-limit cards, plus toasts |
| Duplicate month budget | Second POST for same category+month updates instead of duplicating |
| Month boundaries | 31 Oct vs 1 Nov attributed to separate months (test) |
| Savings goal | RM2,400 target, RM600 saved, six months → RM300.00/month (live API) |
| Past deadline | Returns `months_remaining: 0`, `monthly_needed: null`, `deadline_note: "overdue"`, no division error |
| Simulation | Income 2,500 / expenses 1,600 / +300 recurring → baseline 900.00, proposed 600.00, delta −300.00, assumptions listed, rendered in the browser with a projection chart |
| Simulation isolation | Running a scenario leaves dashboard totals and transaction count unchanged |
| Dashboard | Real seeded figures (2,500 / 1,600 / 900), 6-month bar trend, category donut, alerts, recent rows, goal progress |
| AI chat (grounded) | "Where did my money go this month?" → reply with category table summing to RM1,600.00, `status: ok`, `source: ai:verified-data` |
| AI chat (BM) | "Berapa banyak saya belanja untuk makanan bulan ini?" → Bahasa Melayu answer with RM450.00 / RM400.00 / RM50.00 |
| AI insights page | "Generate analysis" returned `ai.status: ok`, `grounded: true`, with a backend total of RM62.50 over budget and a rendered explanation |
| AI refusal | Request for another account's balance → refuses, offers own summary only |
| AI ungrounded guard | Amounts absent from verified data are rejected; one retry, then a backend-computed summary labelled as such |
| AI not configured | Earlier run with no provider returned 503 `ai_not_configured` plus a computed hint; no fabricated answer |
| AI rate/usage logging | `ai_usage` rows record feature, provider, status, latency, no prompt text |
| Mobile 375px | No horizontal overflow, mobile header, bottom nav, floating assistant button |
| Admin console | Logged in as `admin@moneytwin.my`: 3 accounts, 15 transactions, AI call counts and latency, account list with metadata only |
| Persistence | Data survived several backend restarts (same SQLite file) |
| Secret scan | Built bundle contains no `FLOWISE`, `sk-…`, `APP_SECRET_KEY` or credential-name strings |
| Backend tests | 32 passed (`pytest -q`) |
| TypeScript / build | `tsc --noEmit` clean; `vite build` produced dist (703 kB js, 44 kB css) |
| Migrations | `alembic upgrade head` created all 11 tables on a fresh database |

## Known gaps

- Simulator "save scenario" is stored, but the saved list has no UI yet.
- CSV import/export: JSON export exists; CSV deferred.
- Light/dark mode not implemented (single light theme).
- The live Flowise agent answers in markdown tables, which is longer than the 2–5
  sentence target in the spec. The backend accepts it because every figure is verified;
  tighten the agent prompt if short answers matter more.
- AI error rate over the test session was 45% because of validation retries and the
  deliberately unconfigured run; inspect `ai_usage` for detail.
- `docs/AI-AGENT.md` documents the prompt, tool schemas and routing for Flowise.
