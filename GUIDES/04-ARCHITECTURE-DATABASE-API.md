# MoneyTwin AI — Architecture, Database and REST API

## Diagram
Browser (React/Vite) -> HTTPS/API -> FastAPI server -> PostgreSQL
FastAPI -> deterministic financial services -> sanitized personal context -> optional Flowise Prediction API -> short formatted reply
FastAPI -> plan/AI usage counters, user auth and per-user authorization.
The browser NEVER calls Flowise with a secret nor accesses the database directly.

## Stack
React + Vite + TypeScript, Tailwind CSS, Recharts, React Router and accessible controls. Python FastAPI with Pydantic, SQLAlchemy 2, Alembic, PostgreSQL, pytest. Docker Compose for app/backend/db. JWT in secure HttpOnly cookies or server-side sessions with CSRF protections (choose one mature approach). For local dev only, SQLite fallback clearly noted in documentation. `decimal.Decimal` or integer cents for currency.

## Database schema (proposed tables)
users(id UUID PK, email UNIQUE, password_hash, display_name, role enum owner/admin, locale, created_at, status)
transactions(id UUID PK, user_id FK indexed, type income/expense, amount_minor BIGINT > 0, category_id FK, transaction_date DATE indexed, description nullable, created_at, updated_at)
categories(id UUID PK, user_id FK nullable if predefined system category, name, type, unique scope)
budgets(id UUID PK, user_id FK, category_id FK, month DATE first-day, limit_minor BIGINT >= 0, UNIQUE(user_id,category_id,month))
savings_goals(id UUID PK, user_id FK, title, target_minor BIGINT >0, saved_minor BIGINT >=0, deadline DATE, status, created_at)
simulations(id UUID PK, user_id FK, title, inputs_json, results_json, created_at)
conversations(id UUID PK, user_id FK, title, created_at, updated_at)
messages(id UUID PK, conversation_id FK, role user/assistant, content, status, created_at) [protect and permit deletion]
ai_usage(id UUID PK, user_id FK, model, feature, tokens_input, tokens_output, estimated_cost_minor, status, latency_ms, created_at; no raw user text)
plan_accounts(id UUID PK, user_id FK, plan_name, status, provider_customer_id nullable) [no real billing required]

**Tenant isolation:** user_id is mandatory for every private finance table. If adding tenant_id for a future business account, place it in every query/key and enforce access. Do not permit an Admin to inspect financial records by default.

## REST routes (representative)
POST /api/auth/register | login | logout; GET /api/auth/me
GET/POST /api/transactions; GET/PATCH/DELETE /api/transactions/{id}
GET/POST /api/budgets; PATCH/DELETE /api/budgets/{id}; GET /api/budgets/summary?month=YYYY-MM
GET/POST /api/goals; PATCH/DELETE /api/goals/{id}; POST /api/goals/{id}/contribute (bookkeeping only)
POST /api/simulations/calculate; GET/POST /api/simulations; GET /api/dashboard?month=YYYY-MM
POST /api/ai/analyze; POST /api/ai/chat; GET /api/ai/conversations; GET /api/ai/usage
GET /api/admin/metrics; GET /api/admin/users (admin only; metadata-only)
GET /health and /ready (safe, minimal)

## API payload examples
POST /api/transactions {"type":"expense","amount":"12.50","category_id":"<uuid>","transaction_date":"2026-10-22","description":"Lunch"}
POST /api/simulations/calculate {"monthly_income":"2500.00","monthly_expenses":"1600.00","extra_recurring_expense":"300.00","monthly_savings_commitment":"0.00","months":6}
Response {"baseline_balance":"900.00","projected_balance":"600.00","monthly_delta":"-300.00","currency":"MYR","assumptions":["Income and listed expenses remain constant"]}
POST /api/ai/chat {"conversation_id":null,"message":"How much did I spend on food this month?","locale":"en"}; backend binds signed-in user and retrieves own data; agent response {"reply":"...","conversation_id":"...","data_period":"2026-10","source":"user-data"}.

## Calculation rules
- `baseline_balance = income - recurring_expenses`
- `projected_balance = baseline_balance + income_change + expense_reduction - new_recurring_expenses - savings_contribution`; distinguish one-time purchase vs recurring, divide one-time by months ONLY with explicit amortization assumption or show month 1 separately.
- `budget_spent = sum(expense items in category and local calendar month)`; `remaining = cap - spent`; `percent_used = spent/cap*100` if cap>0; handle zero cap explicitly.
- `goal_monthly_needed = max(0,target-saved)/remaining_months`; if remaining_months<=0 show deadline overdue/no valid duration, not division by zero.
- Financial totals computed on backend from persisted data, never delegated to LLM.

## Env and ports
Frontend http://localhost:5173, API http://localhost:8000, DB via Docker local internal network. Configurable origins and ports. Flowise at http://localhost:3000 (optional) but do NOT change existing Flowise installation. `/api/v1/prediction/{FLOWISE_FLOW_ID}` called backend-only. Use new/dedicated MoneyTwin flow ID.
