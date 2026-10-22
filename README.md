# MoneyTwin AI

A locally running personal finance SaaS for Malaysian students and young workers.
React + Vite + TypeScript frontend, FastAPI backend, SQLite (local) or PostgreSQL,
deterministic finance maths, and a genuinely connected Flowise AI assistant.

Money is stored as integer sen. Every figure on screen is computed by the backend from
the signed-in user's own rows. The AI explains those numbers; it never calculates them
and never invents one.

---

## What runs where

| Piece | URL | Notes |
|---|---|---|
| Frontend (Vite dev) | http://localhost:5173 | proxies `/api` to the backend |
| Backend API | http://localhost:8000 | docs at `/docs`, health at `/health` |
| Flowise (yours) | https://flowise.bdctraining.cloud | MoneyTwin agentflow, server-side only |
| Local Flowise fallback | http://localhost:3000 | optional, `MoneyTwin_Agent` flow |

Ports 3000 (Flowise) and 8766 (KedaiVolt) are untouched by this project.

## Start it

```bat
START-MONEYTWIN.bat
```

or manually:

```powershell
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm run dev
```

First run only:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..\frontend
npm install
```

## Accounts

- **Demo:** click *Explore the demo* on the landing page or sign-in screen.
  Fictional RM2,500 income, RM1,600 expenses, RM900 balance, one savings goal.
- **Admin:** created automatically on first backend start. Password is written to
  `backend/data/admin-credentials.txt` (local dev only). Email `admin@moneytwin.my`.
- **Your own:** register from the sign-up page. Passwords are hashed with Argon2id.

Sessions are server-side rows with an HttpOnly cookie plus a double-submit CSRF token.
No JWT is stored in the browser.

## AI configuration

`backend/.env` (never committed) controls this:

```ini
AI_PROVIDER=flowise                 # off | flowise | openai
FLOWISE_URL=https://flowise.bdctraining.cloud
FLOWISE_FLOW_ID=a2c0e1a6-c2c8-43e0-987e-f6632cc5dcf5
FLOWISE_API_KEY=                    # optional, only if that Flowise has API keys enabled
```

The backend calls `POST {FLOWISE_URL}/api/v1/prediction/{FLOWISE_FLOW_ID}` with
`{"question": ..., "overrideConfig": {"sessionId": ...}}`. The flow ID is scoped to
this app's own `MoneyTwin_Agent` flow; KedaiVolt's flows are never reused.

What the model receives: a system prompt plus a `VERIFIED_DATA` block containing the
month summary, budget usage, goal progress, previous two months and the last eight
transactions (category + amount only, no free-text descriptions). Nothing else, and
nothing belonging to another account.

What is checked: every `RM` amount in a reply must match a verified value, a simple
sum/difference of verified values, or an amount the user typed. A reply that fails is
retried once with a correction; if it still fails the app shows a backend-computed
summary labelled as such instead of a fabricated answer.

Before AI is configured, every finance feature still works and the chat says
"AI is not connected yet" with the computed numbers underneath. It never pretends.

### Local Flowise fallback

A local `MoneyTwin_Agent` chatflow (DeepSeek, same credential as your other flows) was
created in your local Flowise for testing. To use it instead:

```ini
FLOWISE_URL=http://localhost:3000
FLOWISE_FLOW_ID=6d294e77-2815-4c8b-8826-5dfc593e5bea
```

Your KedaiVolt flows were not modified.

## Switching to PostgreSQL

```ini
DATABASE_URL=postgresql+psycopg://moneytwin:password@localhost:5432/moneytwin
```

Install a driver (`pip install "psycopg[binary]"`), then `alembic upgrade head`.
`docker compose up` also starts Postgres, the API and the frontend together.

## Migrations

```powershell
cd backend
.venv\Scripts\python.exe -m alembic upgrade head
```

SQLite also auto-creates tables at startup for convenience; Alembic is the path to
PostgreSQL and is the source of truth for schema changes.

## Tests

```powershell
cd backend
.venv\Scripts\python.exe -m pytest -q
```

Covers authentication, CSRF, rate limiting, per-user isolation, money maths, budget
thresholds, month boundaries, refunds, simulation, goals, AI grounding rules.

```powershell
cd frontend
npm run typecheck
npm run build
```

## API surface

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` `/login` `/demo` `/logout` | sessions |
| GET/PATCH | `/api/auth/me` `/profile` | profile |
| GET | `/api/auth/categories` | categories |
| GET/POST | `/api/transactions` | list with filters, create |
| GET/PATCH/DELETE | `/api/transactions/{id}` | single record |
| GET/POST | `/api/budgets` | monthly caps (duplicate month updates) |
| GET | `/api/budgets/summary` | totals and alerts |
| PATCH/DELETE | `/api/budgets/{id}` | edit, remove |
| GET/POST | `/api/goals` | savings goals |
| POST | `/api/goals/{id}/contribute` | bookkeeping only |
| POST | `/api/simulations/calculate` | deterministic what-if |
| GET | `/api/dashboard?month=YYYY-MM` | summary, trend, warnings, previous month |
| GET | `/api/history?months=6` | month-by-month history with change figures |
| POST | `/api/ai/chat` `/api/ai/analyze` `/api/ai/brief` | assistant, detailed analysis, short snapshot |
| GET | `/api/ai/status` `/usage` `/conversations` | AI state and history |
| GET | `/api/admin/metrics` `/users` | aggregates only |

## Troubleshooting

- **Blank page** — check the Vite terminal for a Tailwind or import error, and make
  sure the backend is on 8000.
- **"Cannot reach the MoneyTwin API"** — backend down or wrong port.
- **Chat says not connected** — `AI_PROVIDER`/`FLOWISE_FLOW_ID` missing, or `/ready`
  reports `ai_configured: false`.
- **Flowise 401 / 404** — wrong flow ID, or API keys enabled without `FLOWISE_API_KEY`.
- **Port in use** — set `API_PORT` and Vite `--port`; avoid 3000 and 8766.
- **Reset sessions** — delete rows from `sessions` or clear cookies.

## Chat surfaces

The assistant lives in two places that share one conversation:

- the floating button on every authenticated page, which opens a compact panel
- the full workspace at `/app/chat`

Both read and write the same persisted conversation, so moving between pages keeps the thread.

## Privacy and scope

No bank connections, no card numbers, no payment execution, no credit scoring, no
shared accounts. This is budgeting education and decision support, not licensed
financial advice. Simulations are hypothetical.
